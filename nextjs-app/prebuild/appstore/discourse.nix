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
        (
          { pkgs, ... }@args:
          {
            # START USER CONFIG
            services.discourse.hostname = "discourse.openmesh.network";
            # services.discourse.admin.skipCreate = true;
            services.discourse.admin.email = "xnode@openmesh.network";
            services.discourse.admin.username = "xnode";
            services.discourse.admin.fullName = "Openmesh Xnode";
            services.discourse.admin.passwordFile = builtins.toString (
              args.pkgs.writeText "discourse.password" "discourse-on-xnode" # Minimum length of 10 characters
            );

            services.discourse.mail.notificationEmailAddress = "discourse@openmesh.network";
            services.postfix.settings.main.relayhost = [ "[smtp-relay.gmail.com]:587" ]; # https://support.google.com/a/answer/2956491?hl=en (with IP address authentication)
            # END USER CONFIG

            services.discourse.enable = true;
            services.discourse.database.ignorePostgresqlVersion = true;

            security.acme.acceptTerms = true;
            security.acme.defaults.email = "xnode@self.signed";
            security.acme.defaults.server = "https://localhost:12345";
            systemd.services."acme-order-renew-${args.config.services.discourse.hostname}".script =
              args.lib.mkForce ''echo "selfsigned only"'';

            services.postfix.enable = true;
            services.postfix.settings.main.inet_protocols = "ipv4";

            networking.firewall.allowedTCPPorts = [ 443 ];
          }
        )
      ];
    };
  };
}
