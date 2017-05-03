import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { contain } from 'redux-epic';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import PureComponent from 'react-pure-render/component';

import Classic from './views/classic';
import Step from './views/step';
import Project from './views/project';
import BackEnd from './views/backend';

import {
  replaceChallenge,
  resetUi,

  challengeSelector
} from './redux';
import {
  updateTitle,
  fetchChallenge,
  fetchChallenges
} from '../../redux';
import { makeToast } from '../../Toasts/redux/actions.js';

const views = {
  backend: BackEnd,
  classic: Classic,
  project: Project,
  simple: Project,
  step: Step
};

const mapDispatchToProps = {
  fetchChallenge,
  fetchChallenges,
  makeToast,
  replaceChallenge,
  resetUi,
  updateTitle
};

const mapStateToProps = createSelector(
  challengeSelector,
  state => state.challengesApp.challenge,
  state => state.challengesApp.superBlocks,
  state => state.app.lang,
  (
    {
      challenge: { isTranslated } = {},
      viewType,
      title
    },
    challenge,
    superBlocks = [],
    lang
  ) => ({
    lang,
    isTranslated,
    title,
    challenge,
    viewType,
    areChallengesLoaded: superBlocks.length > 0
  })
);

const fetchOptions = {
  fetchAction: 'fetchChallenge',
  getActionArgs({ params: { block, dashedName } }) {
    return [ dashedName, block ];
  },
  isPrimed({ challenge }) {
    return !!challenge;
  }
};

const link = 'http://forum.freecodecamp.com/t/' +
   'guidelines-for-translating-free-code-camp' +
   '-to-any-language/19111';

const propTypes = {
  areChallengesLoaded: PropTypes.bool,
  fetchChallenges: PropTypes.func.isRequired,
  isStep: PropTypes.bool,
  isTranslated: PropTypes.bool,
  lang: PropTypes.string.isRequired,
  makeToast: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  replaceChallenge: PropTypes.func.isRequired,
  resetUi: PropTypes.func.isRequired,
  title: PropTypes.string,
  updateTitle: PropTypes.func.isRequired,
  viewType: PropTypes.string
 };

export class Show extends PureComponent {

  componentWillMount() {
    const { lang, isTranslated, makeToast } = this.props;
    if (lang !== 'en' && !isTranslated) {
      makeToast({
        message: 'We haven\'t translated this challenge yet.',
        action: <a href={ link } target='_blank'>Help Us</a>,
        timeout: 15000
      });
    }
  }

  componentDidMount() {
    if (!this.props.areChallengesLoaded) {
      this.props.fetchChallenges();
    }
    if (this.props.title) {
      this.props.updateTitle(this.props.title);
    }
  }

  componentWillUnmount() {
    this.props.resetUi();
  }

  componentWillReceiveProps(nextProps) {
    const { title } = nextProps;
    const { block, dashedName } = nextProps.params;
    const { lang, isTranslated } = nextProps;
    const { resetUi, updateTitle, replaceChallenge, makeToast } = this.props;
    if (this.props.params.dashedName !== dashedName) {
      updateTitle(title);
      resetUi();
      replaceChallenge({ dashedName, block });
      if (lang !== 'en' && !isTranslated) {
        makeToast({
          message: 'We haven\'t translated this challenge yet.',
          action: <a href={ link } target='_blank'>Help Us</a>,
          timeout: 15000
        });
      }
    }
  }

  render() {
    const { viewType } = this.props;
    const View = views[viewType] || Classic;
    return <View />;
  }
}

Show.displayName = 'Show(ChallengeView)';
Show.propTypes = propTypes;

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  contain(fetchOptions)
)(Show);
