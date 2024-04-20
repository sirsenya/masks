import { process } from "./process";
import { type Order } from "./types";

process(
  [
    { size: 1, quantity: 10 },
    { size: 2, quantity: 1 },
    { size: 3, quantity: 40 },
    { size: 4, quantity: 40 },
    { size: 5, quantity: 40 },
    { size: 6, quantity: 3 },
    { size: 7, quantity: 3 },
    { size: 8, quantity: 3 },
    { size: 10, quantity: 2 },
    { size: 11, quantity: 2 },
    { size: 24, quantity: 2 },
    { size: 25, quantity: 2 },
    { size: 26, quantity: 1 },
  ],
  [
    { id: 100, size: [1, 2], masterSize: "s1" },
    { id: 101, size: [1, 2], masterSize: "s2" },
    { id: 102, size: [2, 3], masterSize: "s1" },
    { id: 1000, size: [2, 3], masterSize: "s1" },
    { id: 103, size: [4, 5], masterSize: "s2" },
    { id: 104, size: [5, 6], masterSize: "s2" },
    { id: 105, size: [5, 6], masterSize: "s1" },
    { id: 106, size: [7, 8], masterSize: "s2" },
    { id: 107, size: [10, 11], masterSize: "s1" },
    { id: 108, size: [24, 25], masterSize: "s2" },
    { id: 109, size: [25, 26], masterSize: "s1" },
  ]
);

const tests = [
  {
    store: [{ size: 2, quantity: 1 }],
    order: [{ id: 102, size: [1, 2], masterSize: "s1" }],
    isPossible: true,
    mismatches: 1,
  },
  {
    store: [{ size: 3, quantity: 1 }],
    order: [{ id: 102, size: [1, 2], masterSize: "s1" }],
    isPossible: false,
    mismatches: 0,
  },
  {
    store: [{ size: 2, quantity: 4 }],
    order: [
      { id: 101, size: [2] },
      { id: 102, size: [1, 2], masterSize: "s2" },
    ],
    isPossible: true,
    mismatches: 0,
  },
  {
    store: [
      { size: 1, quantity: 1 },
      { size: 2, quantity: 2 },
      { size: 3, quantity: 1 },
    ],
    order: [
      { id: 100, size: [1] },
      { id: 101, size: [2] },
      { id: 102, size: [2, 3], masterSize: "s1" },
      { id: 103, size: [1, 2], masterSize: "s2" },
    ],
    isPossible: true,
    mismatches: 1,
  },
];
