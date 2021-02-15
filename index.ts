import fs from 'fs';

class ServerlessTest {

    hooks: any;
    serverless: any;
    options: any;
    servicePath: string;

    constructor(serverless: any, options: any) {
        this.serverless = serverless;
        this.options = options || {};
        this.servicePath = this.serverless.service.serverless.config.servicePath;

        this.hooks = {
            'after:deploy:deploy': this.deployResources.bind(this)
        }
    }

    async deployResources() {
        const s3Downloads: any = this.serverless.service.custom.s3Downloads;

        console.log(this.serverless.pluginManager.hooks['after:deploy:deploy']);
        const provider: any = this.serverless.getProvider('aws');

        console.log(this.servicePath);
        const region: string = provider.getRegion();
        console.log(region);
        const credentials: any = provider.getCredentials().credentials;
        console.log(credentials);

        const stack: any = await provider.request("CloudFormation", "describeStacks", {
            StackName: provider.naming.getStackName()
        });
        const bucket: any = stack.Stacks[0].Outputs.find((o: any) => o.OutputKey == s3Downloads.bucketNameKey);

        const objects: any = await provider.request("S3", "listObjects", {
            Bucket: bucket.OutputValue
        });
        const bucketName: string = bucket.OutputValue;

        objects.Contents.forEach(async (content: any) => {
            const key: string = content.Key;
            const filePath: string = this.servicePath + "/" + s3Downloads.localDir + "/" + key;
            console.log(key + ' to ' + filePath);

            await provider.request("S3", "getObject", {
                Bucket: bucketName,
                Key: key
            }).then((o: any) => {
                fs.writeFileSync(filePath, o.Body);
            });
        })
    }
}

module.exports = ServerlessTest;
