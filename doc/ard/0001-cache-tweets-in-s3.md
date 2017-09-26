# 1. Cache Tweets in S3

Date: 2017-09-19

## Context

`realtime-ww2-alexa` takes input from the Twitter REST API. Twitter [rate limits](https://dev.twitter.com/rest/public/rate-limiting) their API, caching is hence required
to avoid this skill from being throttled. Additionally network latency must be reduced
to guarantee consistent UX, caching will definitely help on this.

The decision to use S3 as it will incur the lowest running cost should this skill is
not popular enough.

## Decision

`realtime-ww2-alexa` will use S3 to cache the latest tweets.

## Consequences

On going maintenance cost, and potential stale data if a user is trying to
get the latest latest event.

There were 3 serverless options that can be used during the decision making:

 * API Gateway - API Proxy Caching
 * DynamoDB
 * S3

Out of all of the options, API Gateway capability to become a proxy for an API
was the most ideal solution of all as there will no be coding involved at all.
This solution will make the caching totally transparent to `realtime-ww2-alexa`. This solution
however will incur $15 a month regardless of its usage.

DynamoDB supports queries, which mean it is not necessary for `realtime-ww2-alexa`
to grab the entire block of data for every request. DynamoDB will also incur a flat rate
regardless of its usage. Similar to the S3 option, coding is necessary to store
the data in the table which is not ideal.
