const {
	default: axios
} = require('axios');

module.exports = {
	name: "ttdown",
	aliases: ["tiktok", "ttdl"],
	run: async (conn, m, args) => {
// // 		axios.get(`https://api-xcoders.xyz/api/download/tiktok4?url=${args[0]}&apikey=xcoders`).then(res => {
// // 			let yo = res.data.result;
// // 			const buffer = conn.getBuffer(yo, {
// // 				headers: {
// // 				  jar: yo.nowatermark,
// // 				  strictSSL: false,
// // 				},
// // 			  });
// // 			conn.sendDM(m.sender.pk, `📥 𝕋𝕀𝕂𝕋𝕆𝕂 𝔻𝕆𝕎ℕ𝕃𝕆𝔸𝔻𝔼ℝ

// // » Nickname: ${yo.nickname}
// // » Username: ${yo.username}
// // » Views: ${yo.play_count}
// // » Comment: ${yo.comment_count}
// // » Share: ${yo.share_count}
// // » Like: ${yo.love_count}
// // » Caption : ${yo.caption}

// // [#] Url Profile: ${yo.user_url}

// // `)
// 			conn.sendVideo(m.sender.pk, buffer)
		// })
	}
}