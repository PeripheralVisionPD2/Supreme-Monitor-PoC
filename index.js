const request = require("request-promise");
const discord = require("discord.js");
const webhook_link = "put webhook here";
const headers = {
	Accept: "application/json",
	"Accept-Encoding": "gzip, deflate, br",
	"Cache-Control": "no-cache",
	Connection: "keep-alive",
	Pragma: "no-cache",
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36",
	"X-Requested-With": "XMLHttpRequest"
};
let old_prods = [];
let new_prods = [];
let first_run = true;
async function get_time() {
	const opts = {
		url:
			"https://script.googleusercontent.com/macros/echo?user_content_key=686ztcuNHody6A6Xn_rS6qBEjc-yJEgjXdU8Ir2GIJJIPMSt2XrLnPtcraCfMUz-c4tTh0wocClYiwTmM0Zl3t0Q1PdOmZhWm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnJ9GRkcRevgjTvo8Dc32iw_BLJPcPfRdVKhJT5HNzQuXEeN3QFwl2n0M6ZmO-h7C6eIqWsDnSrEd&lib=MwxUjRcLr2qLlnVOLh12wSNkqcO1Ikdrk",
		method: "GET",
		headers: headers,
		gzip: true,
		json: true
	};
	const resp = await request(opts);
	return resp.fulldate.toString();
}
async function monitor() {
	const client = new discord.WebhookClient(
		webhook_link.split("/")[5],
		webhook_link.split("/")[6]
	);
	const items = {
		url: "https://www.supremenewyork.com/shop.json",
		method: "GET",
		headers: headers,
		agentOptions: {
			secureProtocol: "TLSv1_2_method"
		},
		gzip: true,
		json: true
	};
	let resp = await request(items);
	resp = resp["products_and_categories"];
	const newCategory = resp["new"];
	new_prods = [];
	for (let i = 0; i < newCategory.length; i++) {
		let cur_prod = newCategory[i];
		const opts = {
			url: `https://www.supremenewyork.com/shop/${cur_prod.id}.json`,
			method: "GET",
			headers: headers,
			agentOptions: {
				secureProtocol: "TLSv1_2_method"
			},
			gzip: true,
			json: true
		};

		let resp = await request(opts);
		if (first_run == true) {
			old_prods.push({ product: cur_prod, styles: resp });
		}
		new_prods.push({ product: cur_prod, styles: resp });
	}
	first_run = false;
	if (new_prods.length == old_prods.length) {
		for (let i = 0; i < old_prods.length; i++) {
			let old_prod = old_prods[i];
			let new_prod = new_prods[i];
			for (
				let x = 0;
				x < old_prod.styles.styles.length;
				x++
			) {
				let old_style = old_prod.styles.styles[x];
				let new_style = old_prod.styles.styles[x];
				for (
					let y = 0;
					y < old_style.sizes.length;
					y++
				) {
					let old_size = old_style.sizes[y];
					let new_size = new_style.sizes[y];
					if (old_size.stock_level == 0) {
						if (new_size.stock_level != 0) {
							const cur_time = await get_time();
							let embed = new discord.MessageEmbed();
							embed.setDescription(
								"Restock"
							);
							embed.setTitle(
								new_prod.product
									.name
							);
							embed.setImage(
								"https:" +
									new_style.image_url
							);
							embed.addField(
								"Size",
								new_size.name,
								true
							);
							embed.addField(
								"Style",
								new_style.name,
								true
							);
							embed.addField(
								"Price",
								new_prod.product.price
									.toString()
									.slice(
										0,
										-2
									) +
									"." +
									new_prod.product.price
										.toString()
										.slice(
											-2
										),
								true
							);
							embed.setURL(
								"https://supremenewyork.com/shop/" +
									new_prod
										.product
										.id
							);
							embed.setFooter(
								cur_time
							);
							client.send(embed);
							console.log(
								cur_time +
									" [Supreme Monitor] Restock Detected, Webhook Sent!"
							);
						}
					}
				}
			}
		}
		old_prods = new_prods;
	}
}
setInterval(() => {
	monitor();
}, 3000);
