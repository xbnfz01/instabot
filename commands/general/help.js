module.exports = {
  name: "help",
  aliases: ["h", "menu"],
  run: async (conn, m, args) => {
    conn.sendDM(m.sender.pk, `Hi ${m.sender.username}, Do You Want Download Post Video / Foto ?

✅ Mentions This Bot On Postingan To Download Video / Foto....\n
--------------------------------------
𝘋𝘰𝘯𝘢𝘵𝘪𝘰𝘯 : 𝘩𝘵𝘵𝘱𝘴://𝘴𝘢𝘸𝘦𝘳𝘪𝘢.𝘤𝘰/𝘯𝘢𝘧𝘪𝘻919
--------------------------------------------------
  `);
  },
};
