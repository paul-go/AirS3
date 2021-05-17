
namespace AirS3
{
	/**
	 * 
	 */
	export interface IConfiguration
	{
		readonly accessKey: string;
		readonly secretKey: string;
		readonly host?: string;
		readonly port?: number;
		readonly protocol?: Protocol;
		readonly usePathStyle?: boolean;
	}
	
	/**
	 * 
	 */
	export const enum Host
	{
		airbox = "airboxup.com",
		amazon = "s3.amazonaws.com",
		filebase = "s3.filebase.com",
		wasabi = "s3.wasabisys.com",
	}
}
