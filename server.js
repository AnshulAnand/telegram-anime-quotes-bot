require('dotenv').config();
const fetch = require('node-fetch');
const { Scenes, Telegraf, session } = require("telegraf");
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
 
const contactDataWizard = new Scenes.WizardScene(
  'ANIME_WIZARD_SCENE_ID',
  (ctx) => {
    ctx.reply(`Do you want a random quote or a quote from a specific anime or character?\n\nType "Anime" for anime or "Character" for character. Type "Random" if you want a random quote.`);
    ctx.wizard.state.anime = {};
    return ctx.wizard.next();
  },
  async (ctx) => {
    // validation 
    if (ctx.message.text.length < 2) {
      ctx.reply('Please enter a valid anime or character.');
      return; 
    }
    if (ctx.message.text.toLowerCase() === 'random') {
        const response = await fetch('https://animechan.vercel.app/api/random');
        const data = await response.json();
        ctx.reply(`"${data.quote}" \n\n-${data.character}, ${data.anime}`);
        return ctx.scene.leave();
    }
    else if (ctx.message.text.toLowerCase() === 'anime') {
        ctx.wizard.state.anime = 'name';
        ctx.reply('Please enter anime name.');
        return ctx.wizard.next();
    }
    else if (ctx.message.text.toLowerCase() === 'character') {
        ctx.wizard.state.anime = 'character';
        ctx.reply('Please enter character name.');
        return ctx.wizard.next();
    }
    else {
      ctx.reply('Please enter "Anime or "Character".');
    }
  },
  async (ctx) => {
    if (ctx.wizard.state.anime === 'name') {
        let anime = ctx.message.text;
        anime = anime.replace(/ /g,"%20");
        try {
            const response = await fetch(`https://animechan.vercel.app/api/random/anime?title=${anime}`);
            const data = await response.json();
            if (data.error) ctx.reply(data.error + ' Make sure anime name is corect.');
            else ctx.reply(`"${data.quote}" \n\n-${data.character}, ${data.anime}`);
        } catch (error) {
            ctx.reply('No quote found, make sure the name is correct.');
        }
        return ctx.scene.leave();
    }
    else if (ctx.wizard.state.anime === 'character') {
        let character = ctx.message.text;
        character = character.replace(/ /g, "%20");
        try {
            const response = await fetch(`https://animechan.vercel.app/api/random/character?name=${character}`);
            const data = await response.json();
            if (data.error) ctx.reply(data.error + ' Make sure character name is correct.');
            else ctx.reply(`"${data.quote}" \n\n-${data.character}, ${data.anime}`);
        } catch (error) {
            ctx.reply('No quote found, make sure the name is correct.');
        }
        return ctx.scene.leave();
    }
  }
);

const stage = new Scenes.Stage([contactDataWizard]); // Register our scenes
bot.use(session());
bot.use(stage.middleware()); // Stage middleware
bot.on("text", Scenes.Stage.enter('ANIME_WIZARD_SCENE_ID')); // Entering the settings scene when listener worked
bot.launch();
