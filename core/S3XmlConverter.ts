
namespace AirS3
{
	/**
	 * @internal
	 */
	export namespace S3XmlConverter
	{
		/**
		 * Converts XML responses received from S3-compatible storage provides
		 * into a corresponding JSON format.
		 */
		export function toJson(xmlText: string): object
		{
			const parser = new DOMParser();
			const parsed = parser.parseFromString(xmlText, "text/xml");
			
			function recurse(element: Node)
			{
				const object: any = {};
				
				for (const child of Array.from(element.childNodes))
				{
					if (child instanceof Element)
					{
						object[child.tagName] = child.firstElementChild ?
							recurse(child) :
							child.textContent;
					}
				}
				
				return object;
			}
			
			return recurse(parsed);
		}
		
		/**
		 * 
		 */
		export function fromJson(json: S3XmlJsonObject)
		{
			return convertObject("add-xmlns", json as S3XmlJsonObject);
		}
		
		/**
		 * Converts the specified JSON object into an XML representation.
		 */
		function convertObject(
			addXmlns: "add-xmlns" | "no-xmlns",
			object: S3XmlJsonObject)
		{
			const parts = [header];
			let mustAddXmlns = addXmlns === "add-xmlns";
			
			const recurse = (object: S3XmlJsonObject) =>
			{
				for (const [key, value] of Object.entries(object))
				{
					const elementName = key[0].toUpperCase() + key.slice(1);
					
					if (mustAddXmlns)
					{
						mustAddXmlns = false;
						parts.push(`<${elementName} ${ns}>`);
					}
					else
					{
						parts.push(`<${elementName}>`);
					}
					
					if (typeof value === "string")
						parts.push(value);
					
					else if (value === null)
						parts.push("null");
					
					else if (typeof value === "number")
						parts.push(String(value || 0));
					
					else if (Array.isArray(value))
					{
						for (const item of value)
							recurse(item);
					}
					else if (typeof value === "object")
						recurse(value as S3XmlJsonObject);
					
					parts.push("</" + elementName + ">");
				}
			}
			
			recurse(object);
			return parts.join("");
		}
	}
	
	/**
	 * The XML header that is required above all XML responses.
	 */
	const header = `<?xml version="1.0" encoding="UTF-8"?>\n`;
	
	/**
	 * The xmlns attribute that is required on the root level XML tag in some endpoints.
	 */
	const ns = `xmlns="http://s3.amazonaws.com/doc/2006-03-01/"`;
	
	/** */
	export type S3XmlType = 
		typeof String | 
		typeof Number | 
		typeof Boolean | 
		typeof Array;
	
	/** */
	export type S3XmlTypeMap = Record<string, S3XmlType>;
}
