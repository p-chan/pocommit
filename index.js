#!/usr/bin/env node

const cac = require("cac")();
const consola = require("consola");
const prompts = require("prompts");
const shell = require("shelljs");
const cosmiconfig = require("cosmiconfig");

cac.command("", "").action(async () => {
  const explorer = cosmiconfig("pocommit");

  const rcfile = await explorer.searchSync();

  if (!rcfile) return consola.error("設定ファイルが見つかりません");

  const typeChoices = rcfile.config;

  const typeResult = await prompts([
    {
      type: "select",
      name: "type",
      message: "コミットの種類を選択肢してください",
      hint: "矢印キーで選択して、return で決定します",
      choices: typeChoices,
      onState(object) {
        let hint = "";

        typeChoices.map(v => {
          if (object.value === v.value) {
            hint = v.hint;
          }
        });

        this.hint = `💡 ${hint}`;
      }
    }
  ]);

  const titleResult = await prompts([
    {
      type: "text",
      name: "title",
      message: "コミットの概要を入力してください"
    }
  ]);

  if (!titleResult.title || titleResult.title === "")
    return consola.error("コミットの概要を入力してください");

  let bodyList = [];
  let isInputBodyFinish = false;

  while (!isInputBodyFinish) {
    const bodyResult = await prompts([
      {
        type: "text",
        name: "body",
        message: "コミットの詳細を入力してください (無ければctrl+c)"
      }
    ]);

    if (!bodyResult.body || bodyResult.body === "") {
      isInputBodyFinish = true;
    } else {
      bodyList.push(bodyResult.body);
    }
  }

  const confirmResult = await prompts([
    {
      type: "confirm",
      name: "confirm",
      message: "これでコミットしますか？",
      initial: true
    }
  ]);

  if (!confirmResult.confirm) return consola.error("コミットしませんでした");

  let commitCommand = "git commit -F- <<EOM\n";

  commitCommand += `[${typeResult.type}] ${titleResult.title}\n`;

  bodyList.map(body => {
    commitCommand += "\n";
    commitCommand += `- ${body}`;
  });

  commitCommand += "\n";
  commitCommand += "EOM";

  shell.exec(commitCommand);
});

cac.parse();
