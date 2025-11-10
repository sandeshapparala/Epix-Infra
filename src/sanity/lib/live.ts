// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
// Temporarily disabled due to type compatibility issues with current Sanity versions

// import { defineLive } from "next-sanity";
// import { createClient } from 'next-sanity'
// import { apiVersion, dataset, projectId } from '../env'

// const liveClient = createClient({
//   projectId,
//   dataset,
//   apiVersion: 'vX', // Live content is currently only available on the experimental API
//   useCdn: false, // Live content requires fresh data
// })

// export const { sanityFetch, SanityLive } = defineLive({
//   client: liveClient
// });

// Temporary export to avoid import errors
export const sanityFetch = null;
export const SanityLive = () => null;
