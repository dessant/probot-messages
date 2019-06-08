const crypto = require('crypto');

/**
 * Details of the message.

 * @typedef {Object} Message
 * @property {string} owner owner of the repository
 * @property {string} repo repository
 * @property {number} issue issue number of the message
 * @property {?number} comment comment ID of the update
 * @property {boolean} isNew indicates if the issue was newly created
 */
class Message {
  constructor(owner, repo, issue, comment, isNew) {
    this.owner = owner;
    this.repo = repo;
    this.issue = issue;
    this.comment = comment;
    this.isNew = isNew;
  }
}

/**
 * Messages repository maintainers by submitting an issue.

 * @param {Object} app app instance
 * @param {Object} context event context
 * @param {string} title issue title, `{appName}` and `{appUrl}`
 *   are optional placeholders
 * @param {string} message issue content, `{appName}` and `{appUrl}`
 *   are optional placeholders
 * @param {Object} [options] options
 * @param {string} [options.update] update to post as a comment, `{appName}`
 *   and `{appUrl}` are optional placeholders, no update is posted if the value
 *   is {@link https://developer.mozilla.org/en-US/docs/Glossary/Falsy|falsy}
 *   or the issue is locked
 * @param {number} [options.updateAfterDays] post update only if the issue
 *   had no activity in this many days
 * @param {string} [options.owner] owner of the repository
 *   (optional, default value inferred from `context`)
 * @param {string} [options.repo] repository
 *   (optional, default value inferred from `context`)

 * @returns {Promise<Message>} {@link Promise}
 *   that will be fulfilled with a {@link Message} object

 * @example
 * const sendMessage = require('probot-messages');

 * module.exports = app => {
 *   app.on('issue_comment.created', async context => {
 *     await sendMessage(app, context, 'Title', 'Message');
 *   });
 * };
 */
async function sendMessage(
  app,
  context,
  title,
  message,
  {update = '', updateAfterDays = 7, owner, repo} = {}
) {
  if (!app || !context || !title || !message) {
    throw new Error('Required parameter missing');
  }

  if (!owner || !repo) {
    ({owner, repo} = context.repo());
  }

  const appGh = await app.auth();
  const {
    name: appName,
    html_url: appUrl
  } = (await appGh.apps.getAuthenticated()).data;

  const {data: issues} = await context.github.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    creator: `app/${appName}`,
    per_page: 100
  });

  message = message.replace(/{appName}/, appName).replace(/{appUrl}/, appUrl);
  const messageHash = crypto
    .createHash('sha256')
    .update(message)
    .digest('hex');
  const messageHashRx = new RegExp(`<!--${messageHash}-->`);

  for (const issue of issues) {
    if (!messageHashRx.test(issue.body)) {
      continue;
    }

    let commentId = null;
    if (
      update &&
      !issue.locked &&
      Date.now() - Date.parse(issue.updated_at) >=
        updateAfterDays * 24 * 60 * 60 * 1000
    ) {
      update = update.replace(/{appName}/, appName).replace(/{appUrl}/, appUrl);

      const {data: commentData} = await context.github.issues.createComment({
        owner,
        repo,
        issue_number: issue.number,
        body: update
      });
      commentId = commentData.id;
    }

    return new Message(owner, repo, issue.number, commentId, false);
  }

  title = title.replace(/{appName}/, appName).replace(/{appUrl}/, appUrl);

  const {data: issueData} = await context.github.issues.create({
    owner,
    repo,
    title,
    body: `${message}\n<!--${messageHash}-->`
  });

  return new Message(owner, repo, issueData.number, null, true);
}

module.exports = sendMessage;
