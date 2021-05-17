
namespace Cover
{	
	/** */
	export async function modulessReset()
	{
		
	}
	
	/** */
	export function createClient()
	{
		const fs = require("fs") as typeof import("fs");
		const configPath = process.cwd() + "/+config.json";
		
		if (!fs.existsSync(configPath))
			throw new Error("Config file expected to be at: " + configPath);
		
		const configJsonText = fs.readFileSync(configPath).toString("utf-8");
		const configJson = JSON.parse(configJsonText);
		
		const accessKey: string = configJson.accessKey;
		const secretKey: string = configJson.secretKey;
		
		if (typeof accessKey !== "string" || typeof secretKey !== "string")
			throw "Invalid JSON in config file.";
		
		const config = configJson as AirS3.IConfiguration;
		const client = new AirS3.Client(config);
		return client;
	}
	
	declare var module: any;
	module.exports = { Cover };
}

if (typeof module === "object")
	module.exports = { Cover };
