const ALL_NOTIFICATIONS = {
  'kid.newJob': {
    push: 'You\'ve received a new job from {username} for {amount}.\n{title}',
    inapp: 'Received a new job!\n{title}'
  },
  'kid.withdrawComplete': {
    alert: 'Your cash out request for {amount} approved by {username}.\nCollect your money!',
    inapp: 'Approved cash out\nCollect your money!'
  },
  'kid.parentPays': {
    alert: '{username} has taken {amount} from your account.\nCollect your money!',
    inapp: 'Approved cash out\nCollect your money!'
  },
  'kid.kidJobApprovedByParent': {
    alert: 'Your job has been accepted by {username} for {amount}.\n{title}',
    inapp: 'Job accepted. Start now!\n{title}'
  },
  'kid.jobCompleted': {
    alert: 'Nice one! You\'ve been paid {amount} by {username}.\n{title}',
    inapp: 'Job completed. Pay it now!\n{title}'
  },
  'kid.jobRejected': {
    alert: 'Your job has been rejected by {username}. Try another one!\n{title}',
    inapp: 'Job rejected. Try another!\n'
  },
  'parent.kidStartedJob': {
    alert: '{username} has started this job!\n{title}',
    inapp: 'Started a job!\n{title}'
  },
  'parent.kidCompletedJob': {
    alert: '{username} has marked this job as completed!\n{title}',
    inapp: 'Job completed. Pay it now!\n{title}'
  },
  'parent.kidCreatedJob': {
    alert: '{username} has sent you a new job for {amount}.\n{title}',
    inapp: 'Sent a new job!\n{title}'
  },
  'kid.jobSentBackByParent': {
    alert: 'Your job has been sent back by {username}. Fix it now so you can get paid!\n{title}',
    inapp: 'Job sent back. Fix it now!\n{title}'
  },
  'parent.withdrawRequest': {
    alert: '{username} has requested a cash out for {amount}.\nPay it now?',
    inapp: 'Cash out requested\nPay it now?'
  },
  'kid.createFirstJob': {
    alert: 'Send a task or job to get started!\nIt\'s easy! Tap to send one now.',
    inapp: 'Send your first task today\nTo start using Pennybox!'
  },
  'parent.createFirstJob': {
    alert: 'Send a task or job to get started!\nIt\'s easy! Tap to send one now.',
    inapp: 'Send your first task today\nTo start using Pennybox!'
  },
  'kid.inviteParents': {
    alert: 'Have you added your parents yet?\nTap to add them now. It\'s easy!',
    inapp: 'Add your parents today\nSo you can get paid for jobs!'
  },
  'parent.inviteChilds': {
    alert: 'Have you added your kids yet?\nTap to add them now. It\'s easy!',
    inapp: 'Add your kids today\nSo you can send jobs!'
  },
  'family.addedChildToFamily': {
    alert: '{username} has been added as a child to your family!\nSend them a job to do!',
    inapp: '{username}\nAdded as a child to your family'
  },
  'family.addedParentToFamily': {
    alert: '{username} has been added as a parent to your family!\nSend them a job to earn money!',
    inapp: '{username}\nAdded as a parent to your family'
  }
};
