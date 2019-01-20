# Probot Messages

[![Build Status](https://img.shields.io/travis/com/dessant/probot-messages/master.svg)](https://travis-ci.com/dessant/probot-messages)
[![Version](https://img.shields.io/npm/v/probot-messages.svg?colorB=007EC6)](https://www.npmjs.com/package/probot-messages)

A [Probot](https://github.com/probot/probot) extension for communicating with
repository maintainers. It's used for delivering messages that
require user action to ensure the correct operation of the app, such as
configuring the app after installation, or fixing configuration errors.

## Supporting the Project

The continued development of Probot Messages is made possible
thanks to the support of awesome backers. If you'd like to join them,
please consider contributing with [Patreon](https://www.patreon.com/dessant),
[PayPal](https://www.paypal.me/ArminSebastian) or [Bitcoin](https://goo.gl/uJUAaU).

## How It Works

A new issue is opened for messages that don't already have an open issue,
otherwise an update is posted optionally on the existing issue
in the form of a comment.

## Usage

```shell
$ npm install probot-messages
```

**Required permissions**

-   Issues - Read & Write
-   Repository metadata - Read-only

#### Examples

Notify maintainers about additional configuration steps.

```javascript
const sendMessage = require('probot-messages');

module.exports = app => {
  app.on('installation_repositories.added', async context => {
    for (const item of context.payload.repositories_added) {
      const [owner, repo] = item.full_name.split('/');
      await sendMessage(
        app,
        context,
        '[{appName}] Getting started',
        'Follow these steps to configure the app...',
        {owner, repo}
      );
    }
  });
};
```

Notify maintainers about configuration errors.

```javascript
const sendMessage = require('probot-messages');

module.exports = app => {
  app.on('push', async context => {
    const configFile = 'config.yml';
    try {
      const config = await context.config(configFile);
    } catch (error) {
      if (error.name === 'YAMLException') {
        await sendMessage(
          app,
          context,
          '[{appName}] Configuration error',
          '[{appName}]({appUrl}) has encountered a configuration error in ' +
            `\`${configFile}\`.\n\`\`\`\n${error.toString()}\n\`\`\``,
          {update: 'The configuration error is still occurring.'}
        );
      }
    }
  });
};
```

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### sendMessage

Messages repository maintainers by submitting an issue.

#### Parameters

-   `app` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** app instance
-   `context` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** event context
-   `title` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** issue title, `{appName}` and `{appUrl}`
      are optional placeholders
-   `message` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** issue content, `{appName}` and `{appUrl}`
      are optional placeholders
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** options (optional, default `{}`)
    -   `options.update` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** update to post as a comment, `{appName}`
          and `{appUrl}` are optional placeholders, no update is posted if the value
          is [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) (optional, default `''`)
    -   `options.updateAfterDays` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** post update only if the issue
          had no activity in this many days (optional, default `7`)
    -   `options.owner` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** owner of the repository
          (optional, default value inferred from `context`)
    -   `options.repo` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** repository
          (optional, default value inferred from `context`)

#### Examples

```javascript
const sendMessage = require('probot-messages');

module.exports = app => {
  app.on('issue_comment.created', async context => {
    await sendMessage(app, context, 'Title', 'Message');
  });
};
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Message](#message)>** [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)
  that will be fulfilled with a [Message](#message) object

### Message

Details of the message.

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

#### Properties

-   `owner` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** owner of the repository
-   `repo` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** repository
-   `issue` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** issue number of the message
-   `comment` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** comment ID of the update
-   `isNew` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** indicates if the issue was newly created

## License

Copyright (c) 2018-2019 Armin Sebastian

This software is released under the terms of the MIT License.
See the [LICENSE](LICENSE) file for further information.
