import BaseCommand from '../base';

export default class SignMessage extends BaseCommand {
  static description = 'Sign a messsage (arbitrary byte message)';

  static examples = [`$ tonic sign-message`];

  static args = [
    {
      name: 'message',
      description: 'Message to sign',
      parse: (s: string) => Buffer.from(s) as any, // wtf typescript
      required: true,
    },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(SignMessage);
    const signature = await this.account.connection.signer.signMessage(
      args.message,
      this.account.accountId,
      this.connectConfig.networkId
    );
    console.log(
      'signature',
      Buffer.from(signature.signature).toString('base64')
    );
  }
}
