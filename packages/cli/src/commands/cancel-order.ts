import BaseCommand from '../base';

// TODO: support multiple cancellations
export default class CancelOrder extends BaseCommand {
  static description = 'Cancel an order.';

  static examples = [`$ tonic cancel NEAR-ft:ft.examples.testnet 1000`];

  static args = [
    {
      name: 'marketId',
      description: 'Market ID',
      required: true,
    },
    {
      name: 'orderId',
      description: 'Order ID to cancel',
      required: true,
    },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(CancelOrder);
    const { marketId, orderId } = args as { marketId: string; orderId: string };

    this.log(`Canceling order ${orderId}`);
    const { executionOutcome } = await this.tonic.cancelOrder(
      marketId,
      orderId
    );

    this.log(`Canceled order ${orderId}`);
    this.logTransaction(executionOutcome);
  }
}
