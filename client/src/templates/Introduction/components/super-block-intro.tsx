import React from 'react';
import { useTranslation } from 'react-i18next';
import { SuperBlocks } from '../../../../../config/certification-settings';
import { generateIconComponent } from '../../../assets/icons';
import { Spacer } from '../../../components/helpers';
import envData from '../../../../../config/env.json';

const { clientLocale } = envData;

interface SuperBlockIntroProps {
  superBlock: SuperBlocks;
}

function SuperBlockIntro(props: SuperBlockIntroProps): JSX.Element {
  const { t } = useTranslation();
  const { superBlock } = props;

  const superBlockIntroObj: {
    title: string;
    intro: string[];
    note: string[];
  } = t(`intro:${superBlock}`);
  const {
    title: i18nSuperBlock,
    intro: superBlockIntroText,
    note: superBlockNoteText
  } = superBlockIntroObj;

  return (
    <>
      <h1 className='text-center big-heading'>{i18nSuperBlock}</h1>
      <Spacer />
      {generateIconComponent(superBlock, 'cert-header-icon')}
      <Spacer />
      {superBlockIntroText.map((str, i) => (
        <p key={i}>{str}</p>
      ))}
      {superBlockNoteText && (
        <div className='alert alert-info' style={{ marginTop: '2rem' }}>
          {superBlockNoteText}
        </div>
      )}
      {superBlock === SuperBlocks.RelationalDb && clientLocale != 'english' && (
        <div className='alert alert-info' style={{ marginTop: '2rem' }}>
          {t(`intro:misc-text.english-only`)}
        </div>
      )}
    </>
  );
}

SuperBlockIntro.displayName = 'SuperBlockIntro';

export default SuperBlockIntro;
