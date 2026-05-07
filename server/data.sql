-- Esquema do Banco de Dados PoupaMais para PostgreSQL

CREATE TYPE idioma_enum AS ENUM ('portugues', 'ingles', 'espanhol');
CREATE TYPE moeda_enum AS ENUM ('real', 'dolar', 'euro');

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    idioma idioma_enum NOT NULL DEFAULT 'portugues', -- RN10 - O idioma padrão será Português, podendo ser alterado nas configurações.
    moeda moeda_enum NOT NULL DEFAULT 'real', -- RN09 - A moeda padrão do aplicativo será o Real (BRL), podendo ser alterada nas configurações.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RF20 - O sistema deverá manter automaticamente registros de Verificação, que armazenam temporariamente: dados do usuário que ainda não validou seu email (nome, email, senha, idioma), código para verificação, tempo restante para validação, tentativas de validação.
CREATE TABLE verificacao (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    idioma idioma_enum NOT NULL DEFAULT 'portugues',
    codigo VARCHAR(6) NOT NULL,
    expira_em TIMESTAMP NOT NULL,
    tentativas INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- RF21 - O sistema deverá manter automaticamente registros de Recuperação de Senha, que armazenam o usuário, email, código para verificação, tempo restante para validação e tentativas de validação.
CREATE TABLE recuperacao_senha (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_em TIMESTAMP NOT NULL,
    tentativas INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);



CREATE TABLE categoria_despesa (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(70) NOT NULL,
    icone VARCHAR(50) NOT NULL DEFAULT 'Home',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE fonte_receita (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(70) NOT NULL,
    icone VARCHAR(50) NOT NULL DEFAULT 'DollarSign',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE despesa (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(70) NOT NULL,
    valor DECIMAL(11,2) NOT NULL CHECK (valor > 0), -- RN06 - O valor de Despesas, Receitas e Metas deve ser positivo e maior que 0.
    recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    data DATE NOT NULL,
    data_vencimento DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    categoria_despesa_id INT REFERENCES categoria_despesa(id),
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE receita (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(70) NOT NULL,
    valor DECIMAL(11,2) NOT NULL CHECK (valor > 0), -- RN06 - O valor de Despesas, Receitas e Metas deve ser positivo e maior que 0.
    recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    data DATE NOT NULL,
    data_vencimento DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fonte_receita_id INT REFERENCES fonte_receita(id),
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

-- RF22 - O sistema deverá manter automaticamente registros de Exclusões para Despesas, que armazenam a despesa, data de exclusão e usuário.
CREATE TABLE despesa_exclusao (
    id SERIAL PRIMARY KEY,
    despesa_id INT NOT NULL REFERENCES despesa(id) ON DELETE CASCADE,
    data_exclusao DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

-- RF23 - O sistema deverá manter automaticamente registros de Exclusões para Receitas, que armazenam a receita, data de exclusão e usuário.
CREATE TABLE receita_exclusao (
    id SERIAL PRIMARY KEY,
    receita_id INT NOT NULL REFERENCES receita(id) ON DELETE CASCADE,
    data_exclusao DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE meta (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(70) NOT NULL,
    descricao TEXT,
    valor DECIMAL(11,2) NOT NULL CHECK (valor > 0), -- RN06 - O valor de Despesas, Receitas e Metas deve ser positivo e maior que 0.
    valor_atual DECIMAL(11,2) NOT NULL DEFAULT 0 CHECK (valor_atual >= 0), -- RN17 - O valor atual de uma meta será calculado automaticamente pelo sistema como a soma de todas as contribuições vinculadas.
    economia_mensal DECIMAL(11,2) NOT NULL DEFAULT 0 CHECK (economia_mensal >= 0),
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_alvo DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE contribuicao_meta (
    id SERIAL PRIMARY KEY,
    valor DECIMAL(11,2) NOT NULL CHECK (valor >= 0),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    observacao TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    meta_id INT NOT NULL REFERENCES meta(id) ON DELETE CASCADE,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE INDEX idx_verificacao_email ON verificacao(email);
CREATE INDEX idx_recuperacao_senha_email ON recuperacao_senha(email);
CREATE INDEX idx_categoria_despesa_usuario_id ON categoria_despesa(usuario_id);
CREATE INDEX idx_fonte_receita_usuario_id ON fonte_receita(usuario_id);
CREATE INDEX idx_despesa_usuario_id ON despesa(usuario_id);
CREATE INDEX idx_receita_usuario_id ON receita(usuario_id);
CREATE INDEX idx_despesa_exclusao_despesa_id ON despesa_exclusao(despesa_id);
CREATE INDEX idx_despesa_exclusao_usuario_id ON despesa_exclusao(usuario_id);
CREATE INDEX idx_receita_exclusao_receita_id ON receita_exclusao(receita_id);
CREATE INDEX idx_receita_exclusao_usuario_id ON receita_exclusao(usuario_id);
CREATE INDEX idx_meta_usuario_id ON meta(usuario_id);
CREATE INDEX idx_contribuicao_meta_meta_id ON contribuicao_meta(meta_id);
CREATE INDEX idx_contribuicao_meta_usuario_id ON contribuicao_meta(usuario_id);

CREATE OR REPLACE FUNCTION atualizar_valor_atual_meta() -- função para atualizar automaticamente valor_atual da meta quando contribuições são alteradas
RETURNS TRIGGER AS $$
DECLARE
    target_meta_id INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_meta_id := OLD.meta_id;
    ELSE
        target_meta_id := NEW.meta_id;
    END IF;

    UPDATE meta
    SET valor_atual = (
        SELECT COALESCE(SUM(valor), 0)
        FROM contribuicao_meta
        WHERE meta_id = target_meta_id
    )
    WHERE id = target_meta_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_meta ON contribuicao_meta;
CREATE TRIGGER trigger_atualizar_meta
AFTER INSERT OR UPDATE OR DELETE ON contribuicao_meta
FOR EACH ROW
EXECUTE FUNCTION atualizar_valor_atual_meta();
