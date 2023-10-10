/* eslint-disable @typescript-eslint/no-loop-func */
import './BillingContainer.styles.scss';

import { CheckCircleOutlined } from '@ant-design/icons';
import { Button, Col, Row, Skeleton, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import updateCreditCardApi from 'api/billing/checkout';
import getUsage from 'api/billing/getUsage';
import { REACT_QUERY_KEY } from 'constants/reactQueryKeys';
import useAxiosError from 'hooks/useAxiosError';
import useLicense from 'hooks/useLicense';
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { License } from 'types/api/licenses/def';

interface DataType {
	key: string;
	name: string;
	unit: string;
	dataIngested: string;
	pricePerUnit: string;
	cost: string;
}

const renderSkeletonInput = (): JSX.Element => (
	<Skeleton.Input
		style={{ marginTop: '10px', height: '40px', width: '100%' }}
		active
	/>
);

const dummyData: DataType[] = [
	{
		key: '1',
		name: 'Logs',
		unit: '',
		dataIngested: '',
		pricePerUnit: '',
		cost: '',
	},
	{
		key: '2',
		name: 'Traces',
		unit: '',
		dataIngested: '',
		pricePerUnit: '',
		cost: '',
	},
	{
		key: '3',
		name: 'Metrics',
		unit: '',
		dataIngested: '',
		pricePerUnit: '',
		cost: '',
	},
];

const dummyColumns: ColumnsType<DataType> = [
	{
		title: '',
		dataIndex: 'name',
		key: 'name',
		render: renderSkeletonInput,
	},
	{
		title: 'Unit',
		dataIndex: 'unit',
		key: 'unit',
		render: renderSkeletonInput,
	},
	{
		title: 'Data Ingested',
		dataIndex: 'dataIngested',
		key: 'dataIngested',
		render: renderSkeletonInput,
	},
	{
		title: 'Price per Unit',
		dataIndex: 'pricePerUnit',
		key: 'pricePerUnit',
		render: renderSkeletonInput,
	},
	{
		title: 'Cost (Billing period to date)',
		dataIndex: 'cost',
		key: 'cost',
		render: renderSkeletonInput,
	},
];

export default function BillingContainer(): JSX.Element {
	const daysRemainingStr = 'days remaining in your billing period.';
	const [headerText, setHeaderText] = useState('');
	const [billAmount, setBillAmount] = useState(0);
	const [totalBillAmount, setTotalBillAmount] = useState(0);
	const [activeLicense, setActiveLicense] = useState<License | null>(null);
	const [daysRemaning, setDaysRemaning] = useState(0);
	const [isFreeTrail, setIsFreeTrail] = useState(false);
	const [data, setData] = useState<any[]>([]);
	const billCurrency = '$';

	const { isFetching, data: licensesData, error: licenseError } = useLicense();

	const userId = useSelector<AppState, string | undefined>(
		(state) => state.app.user?.userId,
	);

	const handleError = useAxiosError();

	const { isLoading, data: usageData } = useQuery(
		[REACT_QUERY_KEY.GET_BILLING_USAGE, userId],
		{
			queryFn: () => getUsage(activeLicense?.key || ''),
			onError: handleError,
			enabled: activeLicense !== null,
		},
	);

	const getFormattedDate = (date: number): string => {
		const trailEndDate = new Date(date * 1000);

		const options = { day: 'numeric', month: 'short', year: 'numeric' };

		return trailEndDate.toLocaleDateString(undefined, options);
	};

	const getRemainingDays = (BillingEndDate: number): number => {
		// Convert Epoch timestamps to Date objects
		const startDate = new Date(); // Convert seconds to milliseconds
		const endDate = new Date(BillingEndDate * 1000); // Convert seconds to milliseconds

		// Calculate the time difference in milliseconds
		const timeDifference = endDate - startDate;

		return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
	};

	useEffect(() => {
		const activeValidLicense =
			licensesData?.payload?.licenses?.find(
				(license) => license.isCurrent === true,
			) || null;

		setActiveLicense(activeValidLicense);

		if (!isFetching && licensesData?.payload?.onTrial && !licenseError) {
			setIsFreeTrail(true);
			setBillAmount(0);
			setDaysRemaning(0);
			setHeaderText(
				`You are in free trial period. Your free trial will end on ${getFormattedDate(
					licensesData?.payload?.trialEnd,
				)}`,
			);
		}
	}, [isFetching, licensesData?.payload, licenseError]);

	const processUsageData = useCallback(
		(data: any): void => {
			console.log('data', data);
			const {
				details: { breakdown = [], total },
				billingPeriodStart,
				billingPeriodEnd,
			} = data?.payload || {};
			const formattedUsageData: any[] = [];

			for (let index = 0; index < breakdown.length; index += 1) {
				const element = breakdown[index];

				element?.tiers.forEach(
					(tier: { quantity: any; unitPrice: any; tierCost: number }, i: any) => {
						formattedUsageData.push({
							key: `${index}${i}`,
							name: element?.type,
							unit: element?.unit,
							dataIngested: tier.quantity,
							pricePerUnit: tier.unitPrice,
							cost: `$ ${tier.tierCost}`,
						});
					},
				);
			}

			console.log('formattedUsageData', formattedUsageData);

			setData(formattedUsageData);
			setTotalBillAmount(total);

			if (!licensesData?.payload?.onTrial) {
				setHeaderText(
					`Your current billing period is from ${getFormattedDate(
						billingPeriodStart,
					)} to ${getFormattedDate(billingPeriodEnd)}`,
				);
				setDaysRemaning(getRemainingDays(billingPeriodEnd));
				setBillAmount(total);
			}
		},
		[licensesData?.payload?.onTrial],
	);

	useEffect(() => {
		if (!isLoading && usageData) {
			processUsageData(usageData);
		}
	}, [isLoading, processUsageData, usageData]);

	const columns: ColumnsType<DataType> = [
		{
			title: '',
			dataIndex: 'name',
			key: 'name',
			render: (text): JSX.Element => <div>{text}</div>,
		},
		{
			title: 'Unit',
			dataIndex: 'unit',
			key: 'unit',
		},
		{
			title: 'Data Ingested',
			dataIndex: 'dataIngested',
			key: 'dataIngested',
		},
		{
			title: 'Price per Unit',
			dataIndex: 'pricePerUnit',
			key: 'pricePerUnit',
		},
		{
			title: 'Cost (Billing period to date)',
			dataIndex: 'cost',
			key: 'cost',
		},
	];

	const renderSummary = (): JSX.Element => (
		<Table.Summary.Row>
			<Table.Summary.Cell index={0}>
				<Typography.Title level={3} style={{ fontWeight: 500, margin: ' 0px' }}>
					Total
				</Typography.Title>
			</Table.Summary.Cell>
			<Table.Summary.Cell index={1}> &nbsp; </Table.Summary.Cell>
			<Table.Summary.Cell index={2}> &nbsp;</Table.Summary.Cell>
			<Table.Summary.Cell index={3}> &nbsp; </Table.Summary.Cell>
			<Table.Summary.Cell index={4}>
				<Typography.Title level={3} style={{ fontWeight: 500, margin: ' 0px' }}>
					${totalBillAmount}
				</Typography.Title>
			</Table.Summary.Cell>
		</Table.Summary.Row>
	);

	const renderTableSekelton = (): JSX.Element => (
		<Table
			dataSource={dummyData}
			pagination={false}
			columns={dummyColumns}
			locale={{
				emptyText: dummyData.map((u) => (
					<Skeleton.Input
						key={u.key}
						style={{ marginTop: '10px', height: '50px', width: '100%' }}
						active
					/>
				)),
			}}
		/>
	);

	const { mutate: updateCreditCard, isLoading: isLoadingBilling } = useMutation(
		updateCreditCardApi,
		{
			onSuccess: (data) => {
				window.open(data.payload?.redirectURL);
			},
			onError: () => console.log('error'),
		},
	);

	const handleBilling = useCallback(async () => {
		updateCreditCard({
			licenseKey: activeLicense?.key || '',
			successURL: window.location.href,
			cancelURL: window.location.href,
		});
	}, [activeLicense?.key, updateCreditCard]);

	return (
		<div className="billing-container">
			<Row
				justify="space-between"
				align="middle"
				gutter={[16, 16]}
				style={{
					margin: 0,
				}}
			>
				<Col span={20}>
					<Typography.Title level={4} ellipsis style={{ fontWeight: '300' }}>
						{headerText}
					</Typography.Title>
				</Col>

				<Col span={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button
						type="primary"
						size="middle"
						loading={isLoadingBilling}
						onClick={handleBilling}
					>
						{isFreeTrail ? 'Upgrade Plan' : 'Manage Billing'}
					</Button>
				</Col>
			</Row>

			<div className="billing-summary">
				<Typography.Title level={4} style={{ margin: '16px 0' }}>
					Current bill total
				</Typography.Title>

				<Typography.Title
					level={3}
					style={{ margin: '16px 0', display: 'flex', alignItems: 'center' }}
				>
					{billCurrency}
					{billAmount} &nbsp;
					{isFreeTrail ? <Tag color="success"> Free Trail </Tag> : ''}
				</Typography.Title>

				<Typography.Paragraph style={{ margin: '16px 0' }}>
					{daysRemaning} {daysRemainingStr}
				</Typography.Paragraph>
			</div>

			<div className="billing-details">
				{!isLoading && (
					<Table
						columns={columns}
						dataSource={data}
						pagination={false}
						summary={renderSummary}
					/>
				)}

				{isLoading && renderTableSekelton()}
			</div>

			{isFreeTrail && (
				<div className="upgrade-plan-benefits">
					<Row
						justify="space-between"
						align="middle"
						style={{
							margin: 0,
						}}
						gutter={[16, 16]}
					>
						<Col span={20} className="plan-benefits">
							<Typography.Text className="plan-benefit">
								<CheckCircleOutlined />
								Upgrade now to have uninterrupted access
							</Typography.Text>
							<Typography.Text className="plan-benefit">
								<CheckCircleOutlined />
								You will be charged only when trial period ends
							</Typography.Text>
							<Typography.Text className="plan-benefit">
								<CheckCircleOutlined />
								<span>
									Check out features in paid plans &nbsp;
									<a
										href="https://signoz.io/pricing/"
										style={{
											color: '#f99781',
										}}
										target="_blank"
										rel="noreferrer"
									>
										here
									</a>
								</span>
							</Typography.Text>
						</Col>
						<Col span={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
							<Button type="primary" size="middle">
								Upgrade Plan
							</Button>
						</Col>
					</Row>
				</div>
			)}
		</div>
	);
}
