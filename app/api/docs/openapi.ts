/**
 * API Documentation
 * Equilibria Finance API v1
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique transaction ID
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         type:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *           description: Transaction type
 *         category:
 *           type: string
 *           description: Transaction category
 *         description:
 *           type: string
 *           description: Transaction description
 *         date:
 *           type: string
 *           format: date
 *           description: Transaction date
 *     Budget:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         category:
 *           type: string
 *         limit:
 *           type: number
 *         spent:
 *           type: number
 *     Wallet:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         balance:
 *           type: number
 *         currency:
 *           type: string
 *     Goal:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         targetAmount:
 *           type: number
 *         currentAmount:
 *           type: number
 *         deadline:
 *           type: string
 *           format: date
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         code:
 *           type: string
 *           description: Error code
 */

const API_DOCS = {
  info: {
    title: 'Equilibria Finance API',
    version: '2.0.0',
    description: 'API for Equilibria Finance Tracker - Personal finance management application',
    contact: {
      name: 'Equilibria Support',
    },
  },

  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    },
  ],

  routes: {
    '/api/transactions': {
      get: {
        summary: 'Get all transactions',
        tags: ['Transactions'],
        responses: {
          '200': {
            description: 'List of transactions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    transactions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Transaction' },
                    },
                    summary: {
                      type: 'object',
                      properties: {
                        balance: { type: 'number' },
                        totalIncome: { type: 'number' },
                        totalExpense: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create new transaction',
        tags: ['Transactions'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['amount', 'type', 'category', 'date'],
                properties: {
                  amount: { type: 'string', description: 'Amount in smallest currency unit' },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  category: { type: 'string' },
                  description: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Transaction created' },
          '400': { description: 'Invalid input' },
        },
      },
    },

    '/api/budgets': {
      get: {
        summary: 'Get all budgets',
        tags: ['Budgets'],
        responses: {
          '200': {
            description: 'List of budgets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    budgets: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Budget' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/wallets': {
      get: {
        summary: 'Get all wallets',
        tags: ['Wallets'],
        responses: {
          '200': {
            description: 'List of wallets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    wallets: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Wallet' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/goals': {
      get: {
        summary: 'Get all financial goals',
        tags: ['Goals'],
        responses: {
          '200': {
            description: 'List of goals',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    goals: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Goal' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    checks: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default API_DOCS;