export const formatDate = (value, options = {}) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
};

export const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const groupHistoryByDate = (records) =>
  records.reduce((groups, record) => {
    const key = new Date(record.createdAt).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});
