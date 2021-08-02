import { MempoolTransactionRequest, NetworkRequest, Params } from "types";
import {
  MempoolResponse,
  TransactionIdentifier,
  MempoolTransactionResponse,
} from "../client";
import {
  getNetworkApiFromRequest,
  getNetworkCurrencyFromRequest,
} from "../utils/connections";
import { ApiPromise } from "@polkadot/api";
import { getTransactionFromPool } from "src/utils/functions";

/* Data API: Mempool */

/**
 * Get All Mempool Transactions
 * Get all Transaction Identifiers in the mempool
 *
 * networkRequest NetworkRequest
 * returns MempoolResponse
 * */
export const mempool = async (
  params: Params<NetworkRequest>
): Promise<MempoolResponse> => {
  const { networkRequest } = params;
  const api: ApiPromise = await getNetworkApiFromRequest(networkRequest);
  //const transactions = [];
  const transactions = await api.rpc.author.pendingExtrinsics();
  const transactionIdentifiers =
    transactions?.map(
      (extrinsic) => new TransactionIdentifier(extrinsic.hash.toString())
    ) || [];
  return new MempoolResponse(transactionIdentifiers);
};

/**
 * Get a Mempool Transaction
 * Get a transaction in the mempool by its Transaction Identifier.
 * This is a separate request than fetching a block transaction (/block/transaction) because some blockchain nodes need to know
 * that a transaction query is for something in the mempool instead of a transaction in a block.
 * Transactions may not be fully parsable until they are in a block (ex: may not be possible to determine the fee to pay before a transaction is executed).
 * On this endpoint, it is ok that returned transactions are only estimates of what may actually be included in a block.
 *
 * mempoolTransactionRequest MempoolTransactionRequest
 * returns MempoolTransactionResponse
 * */
export const mempoolTransaction = async (
  params: Params<MempoolTransactionRequest>
): Promise<MempoolTransactionResponse> => {
  const { mempoolTransactionRequest } = params;
  const api: ApiPromise = await getNetworkApiFromRequest(
    mempoolTransactionRequest
  );
  const { hash } = mempoolTransactionRequest.transaction_identifier;
  const mempoolTransactions = await api.rpc.author.pendingExtrinsics();

  const transactionInPool = mempoolTransactions?.find(
    (t) => t.hash.toString() === hash.toString()
  );

  if (!transactionInPool) return {} as MempoolTransactionResponse;

  const currency = getNetworkCurrencyFromRequest(mempoolTransactionRequest);

  const transaction = getTransactionFromPool(api, transactionInPool, currency);

  return new MempoolTransactionResponse(transaction);
};
