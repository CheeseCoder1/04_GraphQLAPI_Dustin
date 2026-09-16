export const typeDefs = `
  type Category {
    id: ID!
    name: String!
    type: String!
    transactions: [Transaction!]!
    relationCallCount: Int 
  }

  type Transaction {
    id: ID!
    amount: Float!
    type: String!
    description: String
    createdAt: String
    category: Category
    relationCallCount: Int
  }

  type Query {
    categories: [Category!]!
    transactions: [Transaction!]!
    transaction(id: ID!): Transaction
  }

  type Mutation {
    createTransaction(amount: Float!, type: String!, description: String, categoryId: ID!): Transaction!
    updateTransaction(id: ID!, amount: Float, type: String, description: String, categoryId: ID): Transaction
    deleteTransaction(id: ID!): Boolean!
  }
`;