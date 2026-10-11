// Dados da marca usados em todo o site.
// Campos vazios simplesmente não aparecem (ex.: sem Instagram, o ícone some).
export const brand = {
  name: 'ChocoFeliz',
  tagline: 'Pirulitos de chocolate personalizados',
  // Só números, com DDI e DDD. Ex.: '5535999998888'.
  // Enquanto estiver vazio, os botões abrem o WhatsApp para a pessoa escolher o contato.
  whatsapp: '5535988648782',
  // Só o usuário, sem @. Ex.: 'chocofeliz'
  instagram: '',
  email: '',
  // Ex.: 'Poços de Caldas e região'
  city: '',
}

export function whatsappUrl(message: string) {
  const text = encodeURIComponent(message)
  return brand.whatsapp ? `https://wa.me/${brand.whatsapp}?text=${text}` : `https://wa.me/?text=${text}`
}

export const instagramUrl = brand.instagram ? `https://instagram.com/${brand.instagram}` : ''
