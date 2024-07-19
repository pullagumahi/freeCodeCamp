import React, { useEffect, ReactElement } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { useTranslation } from 'react-i18next';

import { Test } from '../../../redux/prop-types';
import { SuperBlocks } from '../../../../../shared/config/superblocks';
import { initializeMathJax } from '../../../utils/math-jax';
import { challengeTestsSelector } from '../redux/selectors';
import { openModal } from '../redux/actions';
import TestSuite from './test-suite';
import ToolPanel from './tool-panel';

import './side-panel.css';

const mapStateToProps = createSelector(
  challengeTestsSelector,
  (tests: Test[]) => ({
    tests
  })
);

const mapDispatchToProps: {
  openModal: (modal: string) => void;
} = {
  openModal
};

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = typeof mapDispatchToProps;

interface SidePanelProps extends DispatchProps, StateProps {
  block: string;
  challengeDescription: ReactElement;
  challengeTitle: ReactElement;
  guideUrl: string;
  hasDemo: boolean | null;
  instructionsPanelRef: React.RefObject<HTMLDivElement>;
  showToolPanel: boolean;
  superBlock: SuperBlocks;
  tests: Test[];
  videoUrl: string;
}

export function SidePanel({
  block,
  challengeDescription,
  challengeTitle,
  guideUrl,
  instructionsPanelRef,
  showToolPanel = false,
  hasDemo,
  superBlock,
  tests,
  videoUrl,
  openModal
}: SidePanelProps): JSX.Element {
  const { t } = useTranslation();
  useEffect(() => {
    const mathJaxChallenge =
      superBlock === SuperBlocks.RosettaCode ||
      superBlock === SuperBlocks.ProjectEuler ||
      block === 'intermediate-algorithm-scripting';
    initializeMathJax(mathJaxChallenge);
  }, [block, superBlock]);

  return (
    <div
      className='instructions-panel'
      ref={instructionsPanelRef}
      tabIndex={-1}
    >
      {challengeTitle}
      {hasDemo && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={() => openModal('projectPreview')}>
          {t('buttons.show-demo')}
        </div>
      )}
      {challengeDescription}
      {showToolPanel && <ToolPanel guideUrl={guideUrl} videoUrl={videoUrl} />}
      <TestSuite tests={tests} />
    </div>
  );
}

SidePanel.displayName = 'SidePanel';

export default connect(mapStateToProps, mapDispatchToProps)(SidePanel);
