export default ({ env }) => {
  const provider = env("UPLOAD_PROVIDER", "local");

  if (provider === "scaleway") {
    return {
      upload: {
        config: {
          provider: "aws-s3",
          providerOptions: {
            credentials: {
              accessKeyId: env("SCALEWAY_ACCESS_KEY_ID"),
              secretAccessKey: env("SCALEWAY_ACCESS_SECRET"),
            },
            endpoint: env("SCALEWAY_S3_ENDPOINT"),
            region: env("SCALEWAY_REGION", "fr-par"),
            forcePathStyle: true,
            params: {
              ACL: env("SCALEWAY_ACL", "public-read"),
              Bucket: env("SCALEWAY_BUCKET"),
            },
          },
          actionOptions: {
            upload: {},
            uploadStream: {},
            delete: {},
          },
        },
      },
    };
  }

  // Local provider by default
  return {
    upload: {
      config: {
        provider: "local",
        providerOptions: {},
      },
    },
  };
};
