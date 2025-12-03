export default ({ env }) => ({
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          credentials: {
            accessKeyId: env('SCALEWAY_ACCESS_KEY_ID'),
            secretAccessKey: env('SCALEWAY_ACCESS_SECRET'),
          },
          endpoint: env('SCALEWAY_S3_ENDPOINT'),
          region: env('SCALEWAY_REGION', 'fr-par'),
          forcePathStyle: true,
          params: {
            ACL: env('SCALEWAY_ACL', 'public-read'),
            Bucket: env('SCALEWAY_BUCKET'),
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  });