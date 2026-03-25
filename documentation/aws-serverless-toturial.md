- [Introduction](#introduction)
  - [AWS free tier for up to 6 months](#aws-free-tier-for-up-to-6-months)
- [AWS Fundamental Concepts](#aws-fundamental-concepts)
  - [Lambda](#lambda)
    - [How Lambda works](#how-lambda-works)
    - [Lambda functions and function handlers](#lambda-functions-and-function-handlers)
      - [Lambda functions](#lambda-functions)
      - [Events](#events)
      - [Lambda functions handler](#lambda-functions-handler)
  - [API Gateway](#api-gateway)
    - [How it works](#how-it-works)
  - [CloudFormation](#cloudformation)
    - [How CloudFormation works](#how-cloudformation-works)
    - [Key concepts](#key-concepts)
      - [Templates](#templates)
      - [Stacks](#stacks)
      - [Change sets](#change-sets)
  - [IAM](#iam)
  - [S3 Bucket](#s3-bucket)
  - [DynamoDB](#dynamodb)
    - [Primary Key](#primary-key)
    - [Secondary indexes](#secondary-indexes)
  - [How a REST API works in AWS](#how-a-rest-api-works-in-aws)
  - [AWS vs K8s](#aws-vs-k8s)
    - [Deployment Flow](#deployment-flow)
      - [K8s deployment flow](#k8s-deployment-flow)
      - [AWS deployment flow](#aws-deployment-flow)
- [Serverless Framework](#serverless-framework)
- [Common Tools](#common-tools)
  - [Zod](#zod)
  - [Vitest \& Nock](#vitest--nock)
    - [Vitest](#vitest)
    - [Nock](#nock)

# Introduction

This document introduces the fundamental AWS concepts, explains how a REST API works in AWS, and demonstrates how to build a serverless API using Serverless Framework, Zod validation, Vitest testing, and Axios integration.

## AWS free tier for up to 6 months

New AWS customers can get started at no cost with the [AWS Free Tier](https://aws.amazon.com/free/). Gain $100 USD credits at sign-up and up to $100 USD more to earn as you explore key AWS services. Test drive AWS services with **the Free Plan for up to 6 months**. You won't be charged unless you choose the Paid Plan, which allows you to scale your operations and gain access to over 150 AWS services.

# AWS Fundamental Concepts

## Lambda

[AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) is a compute service that runs code without the need to manage servers. Your code runs, scaling up and down automatically, with pay-per-use pricing.

```
Request → API Gateway → Lambda
```

> - A function has one specific job or purpose
> - They run only when needed in response to specific events
> - They automatically stop running when finished

### How Lambda works

When using Lambda, you are responsible only for your code. Lambda runs your code on a high-availability compute infrastructure and manages all the computing resources, including server and operating system maintenance, capacity provisioning, automatic scaling, and logging.

Because Lambda is a serverless, event-driven compute service, it uses a different programming paradigm than traditional web applications. The following model illustrates how Lambda works:

1. You write and organize your code in Lambda functions, which are the basic building blocks you use to create a Lambda application.
2. You control security and access through Lambda permissions, using execution roles to manage what AWS services your functions can interact with and what resource policies can interact with your code.
3. Event sources and AWS services trigger your Lambda functions, passing event data in JSON format, which your functions process (this includes event source mappings).
4. Lambda runs your code with language-specific runtimes (like Node.js and Python) in execution environments that package your runtime, layers, and extensions.

### Lambda functions and function handlers

#### Lambda functions

A [Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/concepts-basics.html#gettingstarted-concepts-function) is a piece of code that runs in response to events, such as a user request to a Restful api. Each function is an independent unit of execution and deployment, like a microservice. A function is merely code, deployed in the cloud, that is most often written to perform a single job such as:

Saving a user to the database Processing a file in a database Performing a scheduled task

With durable functions, your code can pause execution between steps, maintaining state automatically, making them ideal for long-running workflows like order processing or content moderation You can think of a function as a kind of self-contained program with the following properties.

```typescript
functions:
  getBooks:
    handler: app/handlers/GetBooks.handler
    description: Get all books from db
    events:
      - http:
          path: /books
          method: get
```

#### Events

Functions are triggered by events. When you configure an event on a Lambda function, Serverless Framework will automatically create the infrastructure needed for that event (e.g. an API Gateway endpoint) and configure your functions to listen to it.

#### Lambda functions handler

A Lambda function handler is the method in your function code that processes events. When a function runs in response to an event, Lambda runs the function handler. Data about the event that caused the function to run is passed directly to the handler. While the code in a Lambda function can contain more than one method or function, Lambda functions can only have one handler.

To create a Lambda function, you bundle your function code and its dependencies in a deployment package. Lambda supports two types of deployment package, .zip file archives and container images.

## API Gateway

Amazon API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs.

API Gateway enables you to connect and access data, business logic, and functionality from backend services such as workloads running on Amazon Elastic Compute Cloud (Amazon EC2), code running on AWS Lambda, any web application, or real-time communication applications.

### How it works

![api gateway](api-gateway-how-it-works.png)

## CloudFormation

AWS [CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html) provides a common language to describe and provision all the infrastructure resources in your environment in a safe, repeatable way.

### How CloudFormation works

When you use CloudFormation, you work with templates and stacks. You create templates to describe your AWS resources and their properties. Whenever you create a stack, CloudFormation provisions the resources that are described in your template.
![alt text](create-stack-diagram.png)

### Key concepts

#### Templates

A CloudFormation template is a YAML or JSON formatted text file. You can save these files with any extension, such as .yaml, .json, .template, or .txt. CloudFormation uses these templates as blueprints for building your AWS resources. For example, in a template, you can describe an Amazon EC2 instance, such as the instance type, the AMI ID, block device mappings, and its Amazon EC2 key pair name. Whenever you create a stack, you also specify a template that CloudFormation uses to create whatever you described in the template.

#### Stacks

When you use CloudFormation, you manage related resources as a single unit called a stack. You create, update, and delete a collection of resources by creating, updating, and deleting stacks. All the resources in a stack are defined by the stack's CloudFormation template.

#### Change sets

If you need to make changes to the running resources in a stack, you update the stack. Before making changes to your resources, you can generate a change set, which is a summary of your proposed changes. Change sets allow you to see how your changes might impact your running resources, especially for critical resources, before implementing them.

## IAM

[AWS Identity and Access Management (IAM)](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html?icmpid=docs_iam_console) is a web service that helps you securely control access to AWS resources. With IAM, you can manage permissions that control which AWS resources users can access. You use IAM to control who is authenticated (signed in) and authorized (has permissions) to use resources. IAM provides the infrastructure necessary to control authentication and authorization for your AWS accounts.

## S3 Bucket

[Amazon Simple Storage Service](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) (Amazon S3) is storage for the internet. You can use Amazon S3 to store and retrieve any amount of data at any time, from anywhere on the web.

## DynamoDB

[Amazon DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html) is a serverless, fully managed, distributed NoSQL database with single-digit millisecond performance at any scale.

### Primary Key

The primary key can consist of one attribute (partition key) or two attributes (partition key and sort key). You need to provide the attribute names, data types, and the role of each attribute: HASH (for a partition key) and RANGE (for a sort key). For more information, see (Primary key)[https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey].

- Partition key – A simple primary key, composed of one attribute known as the partition key.
- All items with the same partition key value are stored together, in sorted order by sort key value.

### Secondary indexes

You can create one or more secondary indexes on a table. A secondary index lets you query the data in the table using an alternate key, in addition to queries against the primary key. DynamoDB doesn't require that you use indexes, but they give your applications more flexibility when querying your data. After you create a secondary index on a table, you can read data from the index in much the same way as you do from the table.

DynamoDB supports two kinds of indexes:

- Global secondary index – An index with a partition key and sort key that can be different from those on the table. The primary key values in global secondary indexes don't need to be unique.
- Local secondary index – An index that has the same partition key as the table, but a different sort key.

In DynamoDB, global secondary indexes (GSIs) are indexes that span the entire table, allowing you to query across all partition keys. Local secondary indexes (LSIs) are indexes that have the same partition key as the base table but a different sort key.

## How a REST API works in AWS

```
Client
   |
   v
API Gateway
   |
   v
Lambda Function
   |
   v
DynamoDB / S3 / External APIs
```

1. Client sends HTTP request
2. API Gateway receives request
3. API Gateway triggers Lambda
4. Lambda executes business logic
5. Lambda returns response
6. API Gateway sends response to client

```
HTTP Request
    |
    v
API Gateway
    |
    |-- Authentication (Cognito / JWT)
    |-- Rate limiting
    |-- Validation
    |
    v
Lambda Handler
    |
    |-- Business logic
    |-- Call AWS services
    |
    v
Response
```

## AWS vs K8s

### Deployment Flow

#### K8s deployment flow

```
Gitlab CI → Docker Build → Push Image → Deploy to K8s
```

#### AWS deployment flow

```
Gitlab CI
   |
   v
serverless deploy
   |
   v
CloudFormation creates resources
```

# Serverless Framework

[Serverless Framework](https://www.serverless.com/framework/docs) is a deployment tool for AWS serverless applications. The Framework is a YAML-based experience that uses simplified syntax to help you deploy complex infrastructure patterns easily, without needing to be a cloud expert.

It manages below resources using one config file.

- Lambda
- API Gateway
- IAM
- DynamoDB
- other resources

# Common Tools

## Zod

[Zod](https://zod.dev) is a TypeScript-first validation library. Using Zod, you can define schemas you can use to validate data, from a simple string to a complex nested object.

## Vitest & Nock

### Vitest

[Vitest](https://vitest.dev/guide/) (pronounced as "veetest") is a next generation testing framework powered by Vite.

### Nock

HTTP server mocking and expectations library for Node.js. [Nock](https://github.com/nock/nock) can be used to test modules that perform HTTP requests in isolation.
