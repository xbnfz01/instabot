const {
  IgApiClient,
  IgCheckpointError
} = require("instagram-private-api");
const {
  instagramIdToUrlSegment
} = require("instagram-id-to-url-segment");
const {
  withFbnsAndRealtime
} = require("instagram_mqtt");
const Bluebird = require("bluebird");
const fs = require("fs");
const axios = require("axios");
const chalk = require("chalk");
const ig = withFbnsAndRealtime(new IgApiClient());
const inquirer = require("inquirer");
const {
  Collection
} = require("@discordjs/collection");
const {
  igDownload
} = require("./functions.js");
const path = require("path");
const didYouMean = require("didyoumean");

// Other Modules
const consola = require("consola");
const CFonts = require('cfonts');
const Spinnies = require("spinnies");
const spinnies = new Spinnies({
  spinner: {
    interval: 200,
    frames: ["∙∙∙", "●∙∙", "∙●∙", "∙∙●", "∙∙∙"],
  },
});

const multi_pref = new RegExp("^[" + "!#$%&?/;:,.<>~-+=".replace(/[|\\{}()[\]^$+*?.\-\^]/g, "\\$&") + "]");


const questionUp = (other) => [{
    type: "input",
    name: "username",
    message: "[>] Insert Username :",
    validate: function (value) {
      if (!value) return "Can't Empty";
      return true;
    },
  },
  {
    type: "password",
    name: "password",
    message: "[>] Insert Password :",
    mask: "*",
    validate: function (value) {
      if (!value) return "Can't Empty";
      return true;
    },
  },
  ...other,
];

module.exports.IGConn = class {
  constructor(argss) {
    this.prefix = "/" || multi_pref;
    this.ig = ig;
    (async () => {
      if (fs.existsSync("./state.json")) {
        await this.readState(ig);
      } else {
        await this.loginToInstagram(ig);
      }

      ig.fbns.on("auth", async () => {
        CFonts.say(`INSTABOT`, {
          font: 'block',
          align: 'center',
          gradient: ['red', 'magenta'],
        });
        await this.saveState(ig);
        CFonts.say(`"Instagram Bot" Coded By Nafizz ` + `\n${new Date().toLocaleString()}` , {
          font: 'console',
          align: 'center',
          gradient: ['red', 'magenta']
        });
        consola.success(chalk.green("Berhasil Login Ke Account Instagram Bot..."));
      });

      // ig.fbns.on("push", async (n) => {
      //   console.log(n);
      // });

      ig.fbns.on("mentioned_comment", async (m) => {
        consola.info(chalk.greenBright(`${new Date().toLocaleString()} `),
          chalk.rgb(255, 0, 0)(m.message));
        const med = await ig.media.info(m.actionParams.media_id);
        const botUsn = (await ig.account.currentUser()).username;
        const senderusrn = m.message
          .replace(`mentioned you in a comment: @${botUsn}`, "")
          .replace("%20", "")
          .trim()
          .toLowerCase();
        const sender = await ig.user.usernameinfo(`${senderusrn}`);
        const notFollow = await this.notFollow(sender.pk);
        if (!notFollow) {
          ig.media.comment({
            mediaId: m.actionParams.media_id,
            text: "Silahkan Follow Instagram Bot Dahulu\n\nLalu Mentions Kembali😊",
            replyToCommentId: m.actionParams.target_comment_id,
          });
          return;
        }
        // this.sendDM(sender.pk, "𝘙𝘦𝘲𝘶𝘦𝘴𝘵 𝘒𝘢𝘮𝘶 𝘚𝘦𝘥𝘢𝘯𝘨 𝘋𝘪 𝘗𝘳𝘰𝘴𝘦𝘴 ...");
        const url = await igDownload(
          "https://instagram.com/p/" + med.items[0].code
        );
        for (let uri of url) {
          const buffer = await this.getBuffer(uri, {
            headers: {
              jar: ig.state.cookieJar,
              strictSSL: false,
            },
          });
          this.sendFoto(sender.pk, buffer).catch(() =>
            this.sendVideo(sender.pk, buffer)
          );
        }
      });
      ig.fbns.on("direct_v2_message", async (m) => {
        consola.info(chalk.greenBright(`${new Date().toLocaleString()}`),
          chalk.rgb(255, 0, 0)(`Message `,
          chalk.blueBright(m.message.split(" ")[1]),
          chalk.rgb(255, 0, 0)(`From  `,
          chalk.yellowBright(m.message.split(" ")[0]),
          )));
        //auto read
        const items = await ig.feed.directPending().items();
        items.forEach(
          async (item) => await ig.directThread.approve(item.thread_id)
        );
        ig.realtime.direct
          .markAsSeen({
            threadId: m.actionParams.id,
            itemId: m.actionParams.x ? m.actionParams.x : m.actionParams.t,
          })
          .catch(() => console.error("Mark as seen error !"));
        let content = m.message
          .split(":")
          .slice(1, m.message.split(":").length)
          .join(":");
        let contentp = content
          .substring(1, content.length)
          .startsWith(this.prefix) ?
          content.substring(1, content.length) :
          "";
        m.body = contentp;
        m.sender = await ig.user.info(m.sourceUserId);
        this.commands = new Collection();
        this.mean = [];
        this.aliases = new Collection();

        fs.readdirSync(path.join(__dirname + "/../commands")).forEach((dir) => {
          const commands = fs
            .readdirSync(path.join(__dirname + `/../commands/${dir}`))
            .filter((file) => file.endsWith(".js"));
          for (let file of commands) {
            let pull = require(`../commands/${dir}/${file}`);
            if (pull.name) {
              this.mean.push(pull.name);
              this.commands.set(pull.name, pull);
            } else {
              continue;
            }
            if (pull.aliases && Array.isArray(pull.aliases))
              pull.aliases.forEach((alias) =>
                this.aliases.set(alias, pull.name)
              );
          }
        });
        let argv = m.body.slice(1).trim().split(/ +/).shift().toLowerCase();
        let args = m.body.trim().split(/ +/).slice(1);
        let command = this.commands.get(argv);
        if (!command) command = this.commands.get(this.aliases.get(argv));

        const notFollow = await this.notFollow(m.sender.pk);
        if (!notFollow) {
          this.sendDM(m.sender.pk, "Silahkan Follow Instagram Bot Dahulu😊");
          return;
        }

        if (
          content.includes("https://instagram.com/") ||
          content.includes("https://www.instagram.com/")
        ) {
          // this.sendDM(m.sender.pk, "Sedang di proses mohon tunggu sebentar.");
          const url = await igDownload(content);
          for (let uri of url) {
            const buffer = await this.getBuffer(uri, {
              headers: {
                jar: ig.state.cookieJar,
                strictSSL: false,
              },
            });
            this.sendFoto(m.sender.pk, buffer).catch(() =>
              this.sendVideo(m.sender.pk, buffer)
            );
          }
        }
        if (
          this.mean.includes(didYouMean(argv, this.mean)) &&
          !this.mean.includes(argv)
        ) {
          this.sendDM(
            m.sender.pk,
            `Mungkin yang anda maksud adalah ${this.prefix}${didYouMean(
              argv,
              this.mean
            )}`
          );
        }
        if (command) {
          //   spinnies.add("spinner-1", {
          //     text: `[CMD] ${command.name}  From (${m.sender.username})`,
          //     color: "green"
          // });
          consola.info(chalk.green(`[CMD] ${new Date().toLocaleTimeString()}  ${command.name}  From (${m.sender.username})`));
          command.run(this, m, args);
        }
        // console.log(m);
      });

      ig.fbns.on("error", consola.error);
      ig.fbns.on("warning", consola.warn);
      ig.realtime.on("error", consola.error);
      ig.realtime.on("close", () => consola.error("RealtimeClient closed"));

      await ig.realtime.connect({
        irisData: await ig.feed.directInbox().request(),
      });
      await ig.fbns.connect();
    })();
  }
  /**
   * Send a dm to a specific user
   * @param {string} id The id or pk of the user
   * @param {string} content The content of the message to send
   */
  async sendDM(id, content) {
    let thread = ig.entity.directThread([id.toString()]);
    await thread.broadcastText(content);
  }
  async sendFoto(id, buffer) {
    let thread = ig.entity.directThread([id.toString()]);
    await thread.broadcastPhoto({
      allowFullAspectRatio: true,
      file: buffer
    });
  }
  async sendVoice(id, buffer) {
    let thread = ig.entity.directThread([id.toString()]);
    await thread.broadcastVoice({
      file: buffer
    })
  }
  async sendVideo(id, buffer) {
    let thread = ig.entity.directThread([id.toString()]);
    await thread.broadcastVideo({
      video: buffer
    });
  }
  async notFollow(id) {
    const followersFeed = ig.feed.accountFollowers(ig.state.cookieUserId);
    const followers = await this.getAllItemsFromFeed(followersFeed);
    const followersUserId = new Set(followers.map(({
      pk
    }) => pk));
    return followersUserId.has(id);
  }
  async getAllItemsFromFeed(feed) {
    let items = [];
    do {
      items = items.concat(await feed.items());
    } while (feed.isMoreAvailable());
    return items;
  }
  async getBuffer(url, options) {
    try {
      options ? options : {};
      const res = await axios({
        method: "get",
        url,
        headers: {
          DNT: 1,
          "Upgrade-Insecure-Request": 1,
        },
        ...options,
        responseType: "arraybuffer",
      });
      return res.data;
    } catch (e) {
      console.log(`Error : ${e}`);
    }
  }
  async readState(ig) {
    if (!fs.existsSync("state.json")) return;
    await ig.importState(
      await fs.readFileSync("./state.json", {
        encoding: "utf8"
      })
    );
  }
  async saveState(ig) {
    return fs.writeFileSync("./state.json", await ig.exportState(), {
      encoding: "utf8",
    });
  }
  async loginToInstagram(ig) {
    return new Promise(async (resolve, reject) => {

      const {
        username,
        password
      } = await inquirer.prompt(questionUp([]));
      Bluebird.try(async () => {
        ig.request.end$.subscribe(() => this.saveState(ig));
        ig.state.generateDevice(username);
        // await ig.simulate.preLoginFlow();
        await ig.account.login(username, password);
        // process.nextTick(async () => await ig.simulate.postLoginFlow());
        resolve(await this.saveState(ig));
      }).catch(IgCheckpointError, async () => {
        ig.state.generateDevice(username);
        console.log(ig.state.checkpoint);
        await ig.challenge.auto(true);
        console.log(ig.state.checkpoint);
        await ig.challenge.sendSecurityCode(code);
        resolve(await this.saveState(ig));
      });
    });
  }
};