import pluralize from 'pluralize';
import { profane } from 'swearjar';

const stripSpecial = str => str.replace(/[^a-zA-Z ]/g, '');

export const checkIfReserved = (str) => {
  const stripped = stripSpecial(str);
  const reservedWords = [
    'pennybox', 'pbox', 'pennyboxadmin', 'penny', 'boxpenny', 'box', 'pennylabs', 'penbox', 'money', 'finance', 'pocketmoney',
    'kid', 'child', 'parent', 'mum', 'dad', 'boy', 'girl', 'uncle', 'aunty', 'grandfather', 'grandmother', 'granny', 'nanny',
    'grandpa', 'granpa', 'grandma', 'granma', 'bro', 'sis', 'cuz', 'him', 'his', 'her', 'his'
  ];

  return !!(reservedWords.map(word => word === stripped || pluralize(word) === stripped).length);
};

export const checkIfProfane = (str) => {
  const stripped = stripSpecial(str);

  return profane(stripped);
};
