#!/usr/bin/env node
import 'source-map-support/register';
import 'dotenv/config'
import * as cdk from 'aws-cdk-lib';
import { StampApiStack } from '../lib/stamp-api-stack';

const app = new cdk.App();
const env = { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION }
const rootDomainName = process.env.DOMAIN_NAME

new StampApiStack(app, 'stampApi', rootDomainName,{env})
