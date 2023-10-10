/* eslint-disable react/no-unescaped-entities */
import './WorkspaceBlocked.styles.scss';

import { CreditCardOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import updateCreditCardApi from 'api/billing/checkout';
import useLicense from 'hooks/useLicense';
import { useCallback, useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { License } from 'types/api/licenses/def';

export default function WorkspaceBlocked(): JSX.Element {
	const [activeLicense, setActiveLicense] = useState<License | null>(null);

	const { isFetching, data: licensesData } = useLicense();

	useEffect(() => {
		const activeValidLicense =
			licensesData?.payload?.licenses?.find(
				(license) => license.isCurrent === true,
			) || null;

		setActiveLicense(activeValidLicense);
	}, [isFetching, licensesData]);

	const { mutate: updateCreditCard } = useMutation(updateCreditCardApi, {
		onSuccess: (data) => {
			window.open(data.payload?.redirectURL);
		},
		onError: () => console.log('error'),
	});

	const handleUpdateCreditCard = useCallback(async () => {
		updateCreditCard({
			licenseKey: activeLicense?.key || '',
			successURL: window.location.origin,
			cancelURL: window.location.origin,
		});
	}, [activeLicense?.key, updateCreditCard]);

	return (
		<Card className="workspace-locked-container">
			<LockOutlined style={{ fontSize: '36px', color: '#08c' }} />
			<Typography.Title level={4}> Workspace Locked </Typography.Title>

			<Typography.Paragraph className="workpace-locked-details">
				You've been locked out of your workspace because we were unable to complete
				a charge on your account. As this is your 2nd missed payment, your data will
				continue to be delivered until date, at which point we will stop collecting
				data and delivering it to your destinations.
			</Typography.Paragraph>

			<Button
				className="update-credit-card-btn"
				type="primary"
				icon={<CreditCardOutlined />}
				size="middle"
				onClick={handleUpdateCreditCard}
			>
				Update Credit Card
			</Button>

			<div className="contact-us">
				Got Questions?
				<span>
					<a href="mailto:support@signoz.io"> Contact Us </a>
				</span>
			</div>
		</Card>
	);
}
