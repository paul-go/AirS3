
(**Project status**: Not working yet. Getting there quickly though. This isn't a side project. It's needed for a commercial product.)

# AirS3

AirS3 is a lightweight S3 HTTP client for browsers. It's designed to feel as egonomic as other HTTP clients such as [ky](https://github.com/sindresorhus/ky), except that the request signing process happens automatically in the background.

## What This Solves

Amazon claims that [S3 has a REST API](https://docs.aws.amazon.com/AmazonS3/latest/API/API_Operations_Amazon_Simple_Storage_Service.html). While this is technically true, the request signing process is so convoluted that in order to get anything done, you can't actually use it like any other REST API, and you instead need to use their SDK which is a 15 ZB JavaScript dependency. Ok, so that's a bit of an exaggeration. But it's certainly not small.

The purpose of this library is to enable ergonomic of the S3 REST API, and let the signing process take care of itself. This is handy when dealing with other S3-compatible services like [Airbox](https://www.airbox.ai) and [Cloudian](https://www.cloudian.com) that have proprietary features in their S3-compatible APIs.

This library is certainly more low-level than using the AWS SDK directly. You'll probably need to keep the [AWS S3 API documentation](https://docs.aws.amazon.com/AmazonS3/latest/API/API_Operations_Amazon_Simple_Storage_Service.html) open while using it. But there are efficiency wins by going this route.

## Features

- Lightweight, only 4kb (GZipped + Minified)
- No dependencies
- Written in TypeScript (compiles with all strict options enabled)
- Code is well commented, optimized for readability, debuggability, and IntelliSense.
- Promise-based API
- Distributes as a single JavaScript file.
- Uses the browser's DOMParser class to efficiently convert JSON POST/PUT bodies into XML.

## Code Examples

Coming soon.

## Funding

The development of this library is funded by [Airbox](https://www.airbox.ai). This library is being used by Airbox's upcoming browser-based S3 file manager (which may also be open-sourced at some point). If you'd like to support this project, consider moving off of Amazon S3 and giving [Airbox](https://www.airbox.ai) a try.
