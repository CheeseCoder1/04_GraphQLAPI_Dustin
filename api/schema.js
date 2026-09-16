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

  input CreateTransactionInput {
    amount: Float!
    type: String!
    description: String
    categoryId: ID!
  }

  input UpdateTransactionInput {
    amount: Float
    type: String
    description: String
    categoryId: ID
  }

  input CreateCategoryInput {
    name: String!
    type: String!
  }

  input UpdateCategoryInput {
    name: String
    type: String
  }

  type Mutation {
    createTransaction(input: CreateTransactionInput!): Transaction!
    updateTransaction(id: ID!, input: UpdateTransactionInput!): Transaction
    deleteTransaction(id: ID!): Boolean!
    
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category
    deleteCategory(id: ID!): Boolean!
  }
`;