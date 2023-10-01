import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal, Typography } from 'antd';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { DeleteDashboard, DeleteDashboardProps } from 'store/actions';
import AppActions from 'types/actions';

import { Data } from '../index';
import { TableLinkText } from './styles';

function DeleteButton({
	deleteDashboard,
	name,
	id,
	refetchDashboardList,
}: DeleteButtonProps): JSX.Element {
	const [modal, contextHolder] = Modal.useModal();

	const openConfirmationDialog = useCallback((): void => {
		modal.confirm({
			title: (
				<Typography.Title level={5}>
					Are you sure you want to delete the
					<span style={{ color: '#e42b35', fontWeight: 500 }}> {name} </span>
					dashboard?
				</Typography.Title>
			),
			icon: <ExclamationCircleOutlined style={{ color: '#e42b35' }} />,
			onOk() {
				deleteDashboard({
					uuid: id,
					refetch: refetchDashboardList,
				});
			},
			okText: 'Delete',
			okButtonProps: { danger: true },
			centered: true,
		});
	}, [name, modal, deleteDashboard, id, refetchDashboardList]);

	return (
		<>
			<TableLinkText type="danger" onClick={openConfirmationDialog}>
				Delete
			</TableLinkText>

			{contextHolder}
		</>
	);
}

interface DispatchProps {
	deleteDashboard: ({
		uuid,
	}: DeleteDashboardProps) => (dispatch: Dispatch<AppActions>) => void;
}

const mapDispatchToProps = (
	dispatch: ThunkDispatch<unknown, unknown, AppActions>,
): DispatchProps => ({
	deleteDashboard: bindActionCreators(DeleteDashboard, dispatch),
});

export type DeleteButtonProps = Data & DispatchProps;

const WrapperDeleteButton = connect(null, mapDispatchToProps)(DeleteButton);

// This is to avoid the type collision
function Wrapper(props: Data): JSX.Element {
	const {
		createdBy,
		description,
		id,
		key,
		refetchDashboardList,
		lastUpdatedTime,
		name,
		tags,
	} = props;

	return (
		<WrapperDeleteButton
			{...{
				createdBy,
				description,
				id,
				key,
				lastUpdatedTime,
				name,
				tags,
				refetchDashboardList,
			}}
		/>
	);
}

export default Wrapper;
