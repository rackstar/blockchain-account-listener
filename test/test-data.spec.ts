import { SolanaAccount } from "../src/types";

export const testAccountUpdates = (): SolanaAccount[] => [
  {
    id: "6BhkGCMVMyrjEEkrASJcLxfAvoW43g6BubxjpeUyZFoz",
    accountType: "mint",
    tokens: 243,
    callbackTimeMs: 500,
    data: {
      mintId: "6BhkGCMVMyrjEEkrASJcLxfAvoW43g6BubxjpeUyZFoz",
    },
    version: 5,
  },
  {
    id: "6BhkGCMVMyrjEEkrASJcLxfAvoW43g6BubxjpeUyZFoz",
    accountType: "mint",
    tokens: 257,
    callbackTimeMs: 8400,
    data: {
      mintId: "6BhkGCMVMyrjEEkrASJcLxfAvoW43g6BubxjpeUyZFoz",
    },
    version: 7,
  },
];
