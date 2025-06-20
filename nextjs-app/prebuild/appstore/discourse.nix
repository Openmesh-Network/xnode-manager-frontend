{
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = inputs: {
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        {
          services.xnode-container.xnode-config = {
            host-platform = ./xnode-config/host-platform;
            state-version = ./xnode-config/state-version;
            hostname = ./xnode-config/hostname;
          };
        }
        (args: {
          # START USER CONFIG
          services.discourse.hostname = "discourse.openmesh.network";
          services.discourse.admin.email = "xnode@openmesh.network";
          services.discourse.admin.username = "xnode";
          services.discourse.admin.fullName = "Openmesh Xnode";
          services.discourse.admin.passwordFile = builtins.toString (
            args.pkgs.writeText "discourse.password" "discourse-on-xnode" # Minimum length of 10 characters
          );

          services.postfix.relayHost = "smtp.gmail.com";
          services.postfix.relayPort = 587;
          # END USER CONFIG

          services.discourse.enable = true;
          services.discourse.database.ignorePostgresqlVersion = true;

          security.acme.acceptTerms = true;
          security.acme.defaults.email = "xnode@self.signed";
          security.acme.defaults.server = "https://localhost:12345";

          services.postfix.enable = true;

          networking.firewall.allowedTCPPorts = [ 443 ];
        })
      ];
    };
  };
}
