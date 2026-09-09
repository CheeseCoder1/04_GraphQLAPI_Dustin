export const typeDefs = `
  type Category {
    id: ID!
    name: String!
    type: String!
    transactions: [Transaction!]!
  }

  type Transaction {
    id: ID!
    amount: Float!
    type: String!
    description: String
    createdAt: String
    category: Category
  }

  type Query {
    categories: [Category!]!
    transactions: [Transaction!]!
    transaction(id: ID!): Transaction
  }
`;