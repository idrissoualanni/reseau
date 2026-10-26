import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  buckets: {
    asset: { access: "private" },
    post: { access: "public_read" },
    profile: { access: "public_read" },
    projet: { access: "public_read" },
    videos: { access: "public_read" },
  },
});
