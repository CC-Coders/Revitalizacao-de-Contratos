/* ==========================================================================
   INSERTS de exemplo — Contrato 1.2.007-077/25 (linha 2 da planilha)
   Fornecedor: DUPLA AÇÃO LOCAÇÃO DE MÁQUINAS E EQUIPAMENTOS LTDA
   CNPJ: 05.543.349/0001-93
   Fonte: "1.2.007- Obra Duplicação PR418 VIA- contrato.xlsx"

   ATENÇÃO — campos que PRECISAM ser confirmados/preenchidos manualmente,
   pois não existem na planilha de medição:
     - @IDCNT               -> ID do contrato no RM (TOTVS). Buscar em TCNT
                               pelo CODIGOCONTRATO = '1.2.007-077/25'.
     - @CODCCUSTO           -> centro de custo do contrato (RM).
     - @CODCFO / @CODCOLCFO -> código do fornecedor no RM (pode ser
                               localizado via FCFO.CGCCFO = CNPJ acima).
     - @NUMEROMEDICAO       -> número sequencial da medição (não está na planilha).
     - TIPO_CONTRATO        -> assumido 'Locação de Equipamento'. Ajustar para
                               'Locação de Equipamento - Com Mão de Obra' se
                               houver mão de obra neste contrato.
     - EQUIPAMENTOS_CONTRATOS_AUXILIAR: só PREFIXO, PRECO_EQUIPAMENTO e STATUS
                               foram preenchidos (dados presentes na planilha).
                               VALOR_MOBILIZADO/EXTRA/MAODEOBRA/DESMOBILIZACAO/
                               NEGOCIACAO_SUPRIMENTOS ficaram NULL — não constam
                               na planilha de medição.
   ========================================================================== */

DECLARE @IDCNT INT = 1511;              -- TODO: preencher com o IDCNT real do RM
DECLARE @CODCCUSTO VARCHAR(7) = '1.2.007';       -- TODO
DECLARE @CODCFO VARCHAR(255) = '008589';           -- TODO
DECLARE @CODCOLCFO INT = 0;                -- TODO
DECLARE @NUMEROMEDICAO INT = <1;        -- TODO

-- ---------------------------------------------------------------------
-- 1) EQUIPAMENTOS_CONTRATOS_AUXILIAR (um registro por prefixo do contrato)
-- ---------------------------------------------------------------------
INSERT INTO [dbo].[EQUIPAMENTOS_CONTRATOS_AUXILIAR]
           ([PREFIXO]
           ,[VALOR_MOBILIZADO]
           ,[UN_MOBILIZADO]
           ,[VALOR_EXTRA]
           ,[UN_EXTRA]
           ,[STATUS]
           ,[MAODEOBRA]
           ,[VALOR_DESMOBILIZACAO]
           ,[UN_DESMOBILIZACAO])
     VALUES
           ('MA11.581', 0, 'hora', 0, 'hora', 3, 0, 0, 'hora'),
           ('MA11.582', 0, 'hora', 0, 'hora', 3, 0, 0, 'hora'),
           ('MA11.583', 0, 'hora', 0, 'hora', 3, 0, 0, 'hora');

-- ---------------------------------------------------------------------
-- 2) TCNT_AUXILIAR (dados gerais do contrato)
-- ---------------------------------------------------------------------
INSERT INTO [dbo].[TCNT_AUXILIAR]
           ([CODCOLIGADA]
           ,[IDCNT]
           ,[IS_MODELO_CASTILHO]
           ,[IS_RETENCAO]
           ,[PERCENT_RETENCAO]
           ,[IS_REIDI]
           ,[PERCENT_REIDI]
           ,[TIPO_ASSINATURA]
           ,[TIPO_CONTRATO]
           ,[ID_FLUIG]
           ,[PERCENT_DESCONTO_CHUVA]
           ,[PERCENT_DESCONTO_DIAS_PARADO]
           ,[DATA_ASSINATURA])
     VALUES
           (12
           ,@IDCNT
           ,1                          -- MODELO CASTILHO = SIM
           ,1                          -- TEM RETENÇÃO = SIM
           ,5                          -- PERCENTUAL RETENÇÃO = 5%
           ,0                          -- TEM REIDI = NÃO
           ,0                          -- PERCENTUAL REIDI = NÃO
           ,'Eletrônica'               -- ASSINATURA ELETRONICA = SIM
           ,'Locação de Equipamento - Com Mão de Obra'   -- TODO: confirmar se tem mão de obra
           ,781029                     -- NUMERO SOLICITAÇÃO FLUIG
           ,NULL                       -- % DESCONTO DIAS DE CHUVA = VAZIO
           ,100                        -- "PODEMOS DESCONTAR ATÉ 100%"
           ,'2025-11-24');             -- DATA ASSINATURA

DECLARE @ID_TCNT_AUXILIAR INT = SCOPE_IDENTITY();

-- ---------------------------------------------------------------------
-- 3) TCNT_AUXILIAR_ITENS (um item por equipamento do contrato)
--    NOTE: a tabela não tem PK explícita documentada no dbCreate.sql atual
--    (provavelmente uma coluna IDENTITY própria, ex. ID/ID_ITEM). Cada item
--    é inserido separadamente e sua identidade capturada via SCOPE_IDENTITY()
--    para uso na seção 5. Confirme o nome real da coluna PK antes de rodar
--    em produção caso ela precise ser referenciada por nome.
-- ---------------------------------------------------------------------
INSERT INTO [dbo].[TCNT_AUXILIAR_ITENS]
           ([ID_TCNT_AUXILIAR]
           ,[NSEQITEMCNT]
           ,[PREFIXO]
           ,[ATIVO])
     VALUES
           (@ID_TCNT_AUXILIAR, 1, 'MA11.581', 1);
DECLARE @ID_ITEM_581 INT = SCOPE_IDENTITY();

INSERT INTO [dbo].[TCNT_AUXILIAR_ITENS]
           ([ID_TCNT_AUXILIAR]
           ,[NSEQITEMCNT]
           ,[PREFIXO]
           ,[ATIVO])
     VALUES
           (@ID_TCNT_AUXILIAR, 2, 'MA11.582',  1);
DECLARE @ID_ITEM_582 INT = SCOPE_IDENTITY();

INSERT INTO [dbo].[TCNT_AUXILIAR_ITENS]
           ([ID_TCNT_AUXILIAR]
           ,[NSEQITEMCNT]
           ,[PREFIXO]
           ,[ATIVO])
     VALUES
           (@ID_TCNT_AUXILIAR, 3, 'MA11.583', 1);
DECLARE @ID_ITEM_583 INT = SCOPE_IDENTITY();

-- ---------------------------------------------------------------------
-- 4) MEDICOES_AUXILIAR (cabeçalho da medição do contrato — período 21/10/2025 a 30/10/2025)
-- ---------------------------------------------------------------------
INSERT INTO [dbo].[MEDICOES_AUXILIAR]
           ([CODCOLIGADA]
           ,[CODCCUSTO]
           ,[CODCFO]
           ,[CODCOLCFO]
           ,[IDCNT]
           ,[CODIGOCONTRATO]
           ,[PERIODOINICIAL]
           ,[PERIODOFINAL]
           ,[NUMEROMEDICAO]
           ,[ACUMULADOANTERIOR]
           ,[PRESENTEMEDICAO]
           ,[ACUMULADOATUAL]
           ,[DESCONTOANTERIOR]
           ,[DESCONTOATUAL]
           ,[PRODUTO]
           ,[POSSUIRETENCAO]
           ,[ULTIMOPDFID]
           ,[RETENCAOANTERIOR]
           ,[RETENCAOATUAL]
           ,[POSSUIREIDI]
           ,[TAXAREIDI]
           ,[REIDIANTERIOR]
           ,[REIDIATUAL]
           ,[OPTANTEPELOSIMPLES]
           ,[CREATEDAT]
           ,[DESCONTOS_EXTRA]
           ,[ACUMULADO_DESCONTOS_EXTRA])
     VALUES
           (12                         -- CODCOLIGADA
           ,@CODCCUSTO
           ,@CODCFO
           ,@CODCOLCFO
           ,@IDCNT
           ,'1.2.007-077/25'
           ,'2025-10-21'               -- PERÍODO INICIAL
           ,'2025-10-30'               -- PERÍODO FINAL
           ,@NUMEROMEDICAO
           ,0.00                       -- VALOR BRUTO MEDIÇÃO - Acumulado Anterior
           ,7800.00                    -- VALOR BRUTO MEDIÇÃO - Presente Medição
           ,7800.00                    -- VALOR BRUTO MEDIÇÃO - Acumulado Atual
           ,0.00                       -- DESCONTOS - Acumulado Anterior
           ,3354.00                    -- DESCONTOS - Acumulado Atual
           ,''                       -- PRODUTO (não consta na planilha)
           ,1                          -- POSSUIRETENCAO (TEM RETENÇÃO = SIM)
           ,NULL                       -- ULTIMOPDFID
           ,0.00                       -- RETENÇÃO - Acumulado Anterior
           ,222.30                     -- RETENÇÃO - Acumulado Atual
           ,0                          -- POSSUIREIDI (TEM REIDI = NÃO)
           ,NULL                       -- TAXAREIDI
           ,NULL                       -- REIDI - Acumulado Anterior (em branco na planilha)
           ,NULL                       -- REIDI - Acumulado Atual (em branco na planilha)
           ,NULL                       -- OPTANTEPELOSIMPLES (não consta na planilha)
           ,GETDATE()                  -- CREATEDAT
           ,NULL                       -- DESCONTOS_EXTRA
           ,NULL);                     -- ACUMULADO_DESCONTOS_EXTRA

DECLARE @ID_MEDICAO INT = SCOPE_IDENTITY();

-- ---------------------------------------------------------------------
-- 5) MEDICOESITENS_AUXILIAR (um item por equipamento medido)
--    ID_ITEMCONTRATO referencia o item correspondente criado em TCNT_AUXILIAR_ITENS.
-- ---------------------------------------------------------------------
INSERT INTO [dbo].[MEDICOESITENS_AUXILIAR]
           ([ID_MEDICAO]
           ,[ID_ITEMCONTRATO]
           ,[DESCRICAO]
           ,[UNIDADE]
           ,[ACUMULADOFISICOANT]
           ,[ACUMULADOFINANCEIROANT]
           ,[DIASTRABALHADOS]
           ,[VALORUNITARIO]
           ,[ACUMULADOFISICOATUAL]
           ,[ACUMULADOFINANCEIROATUAL]
           ,[EQUIPLOCID]
           ,[CREATEDAT]
           ,[PRESENTEFISICO]
           ,[PRESENTEFINANCEIRO])
     VALUES
           (@ID_MEDICAO, @ID_ITEM_581, NULL, 'MÊS', 0.00, 0.00, 10, 19500.00, 0.133333333, 2600.00, NULL, GETDATE(), 0.133333333, 2600.00),
           (@ID_MEDICAO, @ID_ITEM_582, NULL, 'MÊS', 0.00, 0.00, 10, 19500.00, 0.133333333, 2600.00, NULL, GETDATE(), 0.133333333, 2600.00),
           (@ID_MEDICAO, @ID_ITEM_583, NULL, 'MÊS', 0.00, 0.00, 10, 19500.00, 0.133333333, 2600.00, NULL, GETDATE(), 0.133333333, 2600.00);
