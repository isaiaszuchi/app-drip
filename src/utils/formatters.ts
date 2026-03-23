export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string) => {
  if (!date) return '';
  // Se for uma data ISO YYYY-MM-DD, divide e rearranja para evitar erros de fuso horário (GMT/UTC)
  const parts = date.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  // Fallback para outros formatos
  return new Date(date).toLocaleDateString('pt-BR');
};

export const getMonthName = (monthIndex: number) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex];
};
