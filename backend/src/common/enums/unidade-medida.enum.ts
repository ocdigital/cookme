export enum UnidadeMedida {
    // Peso
    KG = 'kg',
    G = 'g',
    MG = 'mg',

    // Volume
    L = 'l',
    ML = 'ml',

    // Medidas de colher (padrão brasileiro)
    COL_SOPA = 'col_sopa',           // 15ml
    COL_CHA = 'col_cha',             // 5ml
    COL_SOBREMESA = 'col_sobremesa', // 10ml
    COL_CAFE = 'col_cafe',           // 2.5ml

    // Medidas de xícara/copo
    XICARA_CHA = 'xicara_cha',           // 240ml
    XICARA_CAFE = 'xicara_cafe',         // 50ml
    COPO_AMERICANO = 'copo_americano',   // 200ml

    // Unidades contáveis
    UN = 'un',
    PCT = 'pct',
    CX = 'cx',
    FATIA = 'fatia',
    PEDACO = 'pedaco',

    // Unidades culinárias específicas
    DENTE = 'dente',   // alho
    FOLHA = 'folha',   // louro, manjericão
    RAMO = 'ramo',     // alecrim, tomilho, cheiro-verde

    // Medidas imprecisas culinárias
    PITADA = 'pitada',   // ~0.5g de tempero seco
    FIO = 'fio',         // fio de azeite/óleo (~10ml)
    PUNHADO = 'punhado', // ~25g de folhas frescas

    // Marcadores semânticos — quantidade = null
    A_GOSTO = 'a_gosto',
    QUANTO_BASTE = 'quanto_baste',
}
