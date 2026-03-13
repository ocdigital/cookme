# Hooks Mobile App

## useHeaderProfile

Hook reutilizável para adicionar um ícone de perfil padronizado no header de qualquer tela.

### Uso

```javascript
import { useHeaderProfile } from '../hooks/useHeaderProfile';
import { useEffect } from 'react';

export default function MyScreen({ navigation }) {
  const headerProfile = useHeaderProfile(navigation);

  useEffect(() => {
    navigation.setOptions(headerProfile);
  }, [navigation]);

  return (
    // ... seu componente
  );
}
```

### Retorno

Retorna um objeto com a propriedade `headerRight` que renderiza um ícone de perfil que navega para a tela 'Profile'.

---

Para mais informações sobre componentes Header, veja `../components/README.md`
