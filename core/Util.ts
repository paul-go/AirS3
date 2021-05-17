
namespace AirS3
{
	/**
	 * @internal
	 */
	export namespace Util
	{
		/**
		 * Returns the "Calendar date" and the "Full date", 
		 * which are the two dates that need to be included
		 * in a signed S3 request.
		 */
		export function getDatePair()
		{
			const date = new Date();
			
			let calendarDate = [
				date.getUTCFullYear(),
				pad(date.getUTCMonth() + 1),
				pad(date.getUTCDate())
			].join("");
			
			let fullDate = [
				calendarDate,
				"T",
				pad(date.getUTCHours()),
				pad(date.getUTCMinutes()),
				pad(date.getUTCSeconds()),
				"Z"
			].join("");
			
			return {
				calendarDate,
				fullDate,
			};
		}
		
		const pad = (num: number) => num < 10 ? "0" + num : String(num);
	}
}
