
namespace Cover
{
	/** */
	export async function coverAirS3()
	{
		const client = Cover.createClient();
		debugger;
	}
	
	/** */
	export async function coverCreateBucket()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		const putResponse = await client.put({ bucket });
		
		return () => putResponse.status === 200;
		
		
	}
	
	/** */
	export async function coverCreateBucketAtRegion()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		
		const putResult = await client.put({
			bucket,
			body: {
				CreateBucketConfiguration: {
					LocationConstraint: "us-east-2"
				}
			}
		});
		
		debugger;
	}
	
	/** */
	export async function coverGetBucketLocation()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		const putResponse = await client.put({ bucket });
		
		const getResponse = await client.get({
			bucket,
			endpoint: "location"
		});
		
		if (getResponse.error)
			return () => !"Fail";
		
		const responseXml = await getResponse.json();
		
		debugger;
	}
	
	/** */
	export async function coverDeleteBucket()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		const putResult = await client.put({ bucket });
		const deleteResult = await client.delete({ bucket });
		
	}
	
	/** */
	export async function coverPutObject()
	{
		const client = Cover.createClient();
		const key = "put-test-key-" + Date.now();
		
		const putResult = await client.put({
			key,
		});
	}
}
