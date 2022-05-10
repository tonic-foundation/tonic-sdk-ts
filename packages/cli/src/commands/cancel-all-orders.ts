import BaseCommand from '../base';

export default class CancelAllOrders extends BaseCommand {
  static description = 'Cancel all user orders in a given market';

  static examples = [`$ tonic cancel-all 123456`];

  static args = [
    {
      name: 'marketId',
      description: 'Market ID',
      required: true,
    },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(CancelAllOrders);
    const { marketId } = args as { marketId: string };

    this.log(`Canceling all orders in market ID ${marketId}`);
    const { executionOutcome } = await this.tonic.cancelAllOrders(marketId);

    this.log(`Canceled all orders in ${marketId}`);
    this.logTransaction(executionOutcome);
  }
}
