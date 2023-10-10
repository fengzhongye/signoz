import { License } from './def';

export type PayloadProps = {
	trialStart: any;
	trialEnd: any;
	onTrial: boolean;
	workSpaceBlock: boolean;
	licenses: License[];
};
