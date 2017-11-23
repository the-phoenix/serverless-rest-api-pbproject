import pluralize from 'pluralize';
import swearjar from 'swearjar';
import joi from 'joi';
import { availableJobStatus } from 'models/Job';
import { availableWithdrawalStatus } from 'models/Withdrawal';

const stripSpecial = str => str.replace(/[^a-zA-Z ]/g, '');

export const checkIfReserved = (str) => {
  const stripped = stripSpecial(str);
  const reservedWords = [
    'pennybox', 'pbox', 'pennyboxadmin', 'penny', 'boxpenny', 'box', 'pennylabs', 'penbox', 'money', 'finance', 'pocketmoney',
    'kid', 'child', 'parent', 'mum', 'dad', 'boy', 'girl', 'uncle', 'aunty', 'grandfather', 'grandmother', 'granny', 'nanny',
    'grandpa', 'granpa', 'grandma', 'granma', 'bro', 'sis', 'cuz', 'him', 'his', 'her', 'his'
  ];

  return !!(reservedWords.filter(word => word === stripped || pluralize(word) === stripped).length);
};

export const checkIfProfane = (str) => {
  const stripped = stripSpecial(str);

  return swearjar.profane(stripped);
};

export const checkCreateJobDataSchema = (rawData) => {
  const schema = joi.object().keys({
    familyId: joi.string().uuid().required(),
    childUserId: joi.string().uuid(),
    jobSummary: joi.object().keys({
      title: joi.string().required(),
      price: joi.number().required(),
      backdropResource: joi.string().uri()
    }),
  });

  return joi.validate(rawData, schema);
};

export const checkUpdateJobStatusSchema = (rawData) => {
  const schema = joi.object().keys({
    status: joi.string().valid(Object.keys(availableJobStatus)).required(),
    meta: joi.object()
  });

  return joi.validate(rawData, schema);
};

export const checkAllowedJobStatusSafeUpdate = (userType, original, newone) => {
  if (!availableJobStatus[newone].allowedRole.includes(userType)) {
    return {
      error: {
        details: 'This user type is not allowed to update job to target status'
      }
    };
  }

  if (!availableJobStatus[original].availableNextMove.includes(newone)) {
    return {
      error: {
        details: 'Forbidden job status update'
      }
    };
  }

  return { error: null };
};

export const checkCreateWithdrawalDataSchema = (rawData) => {
  const schema = joi.object().keys({
    familyId: joi.string().uuid().required(),
    childUserId: joi.string().uuid(),
    amount: joi.number().required()
  });

  return joi.validate(rawData, schema);
};

export const checkUpdateWithdrawalStatusSchema = (rawData) => {
  const schema = joi.object().keys({
    status: joi.string().valid(Object.keys(availableWithdrawalStatus)).required(),
  });

  return joi.validate(rawData, schema);
};

export const checkAllowedWithdrawalStatusSafeUpdate = (userType, original, newone) => {
  if (original !== 'PENDING') {
    return {
      error: {
        details: 'Withdrawal request is already disposed'
      }
    };
  }

  if (!availableWithdrawalStatus[newone].allowedRole.includes(userType)) {
    return {
      error: {
        details: 'This user type is not allowed to update withdrawal request to target status'
      }
    };
  }

  return { error: null };
};

export const checkGetFamilyMemberUsernamesSchema = (rawData) => {
  const schema = joi.object().keys({
    email: joi.string().email().required()
  });

  return joi.validate(rawData, schema);
};
