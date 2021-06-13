
namespace Cover
{
	/** */
	export async function coverCreateBucket()
	{
		const client = Cover.createClient();
		const bucket = createBucketName();
		const putResponse = await client.put({ bucket });
		
		return () => putResponse.status === 200;
	}
	
	/** */
	export async function coverCreateBucketAtRegion()
	{
		const client = Cover.createClient();
		const bucket = createBucketName();
		
		const putResponse = await client.put({
			bucket,
			region: "us-east-2",
			body: {
				CreateBucketConfiguration: {
					LocationConstraint: "us-east-2"
				}
			}
		});
		
		if (putResponse.status !== 200)
			return () => !"Response status is not 200.";
		
		const getResponse = await client.get({
			bucket,
			endpoint: "location"
		});
		
		if (getResponse.error)
			return () => !"GetBucketLocation returned an error.";
		
		const responseJson = await getResponse.json();
		if (responseJson === null)
			return () => !"Response JSON is null.";
		
		return () => responseJson.LocationConstraint === "us-east-2";
	}
	
	/** */
	export async function coverDeleteBucket()
	{
		const client = Cover.createClient();
		const bucket = createBucketName();
		const putResponse = await client.put({ bucket });
		const deleteResponse = await client.delete({ bucket });
		const getResponse = await client.get({
			bucket,
			endpoint: "location"
		});
		
		return [
			() => putResponse.ok,
			() => deleteResponse.ok,
			() => getResponse.ok,
		];
	}
	
	/** */
	export async function coverListBuckets()
	{
		const client = Cover.createClient();
		const getResponse = await client.get();
		const response = await getResponse.json();
		
		return [
			() => response!.ListAllMyBucketsResult.Buckets.Bucket.length > 1
		];
	}
	
	/** */
	export async function coverPutObject()
	{
		const client = Cover.createClient();
		const bucket = createBucketName();
		const key = createKeyName()
		const body = "0".repeat(1000);
		
		await client.put({ bucket });
		const putResponse = await client.put({
			key,
			bucket,
			body
		});
		
		return () => putResponse.ok;
	}
	
	/** */
	export async function coverGetObjectPresigned()
	{
		const client = Cover.createClient();
		const bucket = createBucketName();
		const key = createKeyName()
		const url = await client.getPresigned({ bucket, key });
		
		return () => typeof url === "string";
	}
	
	/** */
	function createBucketName()
	{
		return "airs3-bucket-" + Date.now();
	}
	
	/** */
	function createKeyName()
	{
		return "airs3-key-" + Date.now();
	}
	
	/** */
	export async function coverStopper()
	{
		const client = Cover.createClient();
		const bucket = createBucketName();
		const stopper = new AirS3.Stopper();
		
		await client.put({ bucket });
		client.put({ bucket, key: "A", body: "", stopper });
		client.put({ bucket, key: "B", body: "", stopper });
		stopper.stop();
		
		await new Promise(r => setTimeout(r, 1000));
		
		const getA = await client.get({ bucket, key: "A" });
		const getB = await client.get({ bucket, key: "B" });
		
		return [
			() => getA.status === 404,
			() => getB.status === 404,
		];
	}
}
