import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DataSource } from 'typeorm';
import { User } from './entities';

const getParametersFromSSM = async () => {
    try {
        const ssmClient = new SSMClient({ region: 'eu-central-1' });

        const input = {
            Names: [
                'k8s_rds_host',
                'k8s_rds_db_name',
                'k8s_rds_master_username',
                'k8s_rds_master_password',
            ],
            WithDecryption: true,
        };

        const command = new GetParametersCommand(input);

        const response = await ssmClient.send(command);

        const envVars: Record<string, string> = {};

        if (response.Parameters) {
            for (const p of response.Parameters) {
                if (p.Name && p.Value) {
                    envVars[p.Name] = p.Value;
                }
            }
        }

        return envVars;
    } catch (error: any) {
        throw new Error(`Failed to read parameters from SSM: ${error.message}`);
    }
};

// Configuration for Datasource
export const getDataSource = async (): Promise<DataSource> => {

    const ENV = process.env.ENV || 'dev';

    const ssmParams = ENV === 'prod' ? await getParametersFromSSM() : null;

    if (ENV === 'prod' && !ssmParams) {
        throw new Error('Failed to load SSM parameters for production');
    }

    const dbConfig = ENV === 'prod'
    ? {
        host: ssmParams!['k8s_rds_host'],
        database: ssmParams!['k8s_rds_db_name'],
        username: ssmParams!['k8s_rds_master_username'],
        password: ssmParams!['k8s_rds_master_password'],
    }
    : {
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
    };

    const dataSource = new DataSource({
        type: "postgres",
        ...dbConfig,
        entities: [User],
        synchronize: ENV !== 'prod',
        logging: false,
    });
    return dataSource;
    
};
