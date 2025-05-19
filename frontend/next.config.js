/** @type {import("next").NextConfig} */
module.exports = {
  output: "standalone",
  env: {
    // Replace with your actual Ory project URL
    NEXT_PUBLIC_ORY_SDK_URL: process.env.NEXT_PUBLIC_ORY_SDK_URL || "https://playground.projects.oryapis.com"
  }
}
